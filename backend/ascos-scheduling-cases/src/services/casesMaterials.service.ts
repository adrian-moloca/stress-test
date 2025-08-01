import { LoggingService } from '@smambu/lib.commons-be'
import {
  Component,
  Contract,
  IAnagraphicVersion,
  ICaseOPItem,
  IUser,
  MEDICALS_SAMMEL_CODE,
  MaterialPrice,
  OpStandardIntraOpSection,
  OpStandardMaterial,
  OpStandardPostOpSection,
  OpStandardPreOpSection,
  CaseIntraOpSection,
  CasePostOpSection,
  CasePreOpSection,
  UserPermissions,
  anagraphicsTypes,
  callMSWithTimeoutAndRetry,
  dateString,
  getCaseOpStandard,
  systemConfigurationSections,
  CaseOpStandardMaterial,
  CaseOpStandardMedication,
  CaseForm,
} from '@smambu/lib.constantsjs'
import {
  Inject,
  Injectable,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectModel } from '@nestjs/mongoose'
import { format } from 'date-fns'
import { Model } from 'mongoose'
import { Case, CaseDocument } from '../schemas/cases.schema'

interface ICaseMaterial {
  code?: string
  materialId?: string
  medicationId?: string
  amount: number
}

@Injectable()
export class CasesMaterialsService {
  constructor (
    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,
    @Inject('CONTRACT_CLIENT')
    private readonly contractClient: ClientProxy,
    @Inject('ANAGRAPHICS_CLIENT')
    private readonly anagraphicsClient: ClientProxy,
    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.SCHEDULING_CASES)
  }

  async getAnagraphicVersion (
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    date,
    userPermissions
  ) {
    const payload = {
      anagraphicType,
      subType,
      date,
      userPermissions
    }
    const pattern = { role: 'anagraphic', cmd: 'getTargetAnagraphic' }

    return await callMSWithTimeoutAndRetry(this.anagraphicsClient,
      pattern,
      payload,
      Component.SCHEDULING_CASES)
  }

  async getSystemConfigPharmacySupplierCodes (): Promise<string[]> {
    try {
      const pattern = { role: 'SystemConfigurationSection', cmd: 'get' }

      const payloadData = {
        section: systemConfigurationSections.SUPPLIER_CODES
      }
      const supplierCodes = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      return supplierCodes?.data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getContractById (contractId: string, user: IUser,
    userPermissions: UserPermissions, permissionCheck: boolean = false): Promise<Contract> {
    try {
      const pattern = { role: 'contracts', cmd: 'getContract' }

      const payloadData = {
        id: contractId,
        userPermissions,
        user,
        permissionCheck
      }
      const contract = await callMSWithTimeoutAndRetry(this.contractClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      return contract
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  tryParseCaseMaterial (
    material: ICaseMaterial,
    feParsedVersion: IAnagraphicVersion,
    supplierCodes: string[],
    isMedication: boolean = false,
    contract: Contract,
    caseObj: Case
  ): ICaseOPItem {
    const id = material.code ?? material.materialId ?? material.medicationId

    if (!id) throw new Error('material_without_id_error')

    const matching = feParsedVersion?.rows?.find(row => row.artikelnummer === id)

    if (!matching) return ({
      id,
      name: null,
      price: null,
      amount: material.amount,
      isMedication,
      isSammelArticle: null,
      isSachkostenArticle: null,
      sammelFactor: null,
      unitOfMeasure: null,
      pzn: null,
      sammelCategory: null,
      basicPricePerUnit_PublicInsurance: null,
      basicPricePerUnit_PrivateInsurance: null,
      supplierNumber: null,
      supplier: null,
    })

    const isSammelArticle = matching.sprechstundenbedarf as boolean
    const isSachkostenArticle = matching['überKvAbrechenbar'] as boolean
    const sammelFactor = matching.faktor as number
    const supplierNumber = matching.artikelnummerLieferant as string

    const supplier = matching.lieferantKurz as string

    const unitOfMeasure = matching.einheitKurz as string
    const pzn = matching.pzn as number

    const sammelCategoryRaw = `${matching.lieferantKurz}`

    const matchingSammel = supplierCodes?.find(current => current === sammelCategoryRaw)
    const sammelCategory = matchingSammel || MEDICALS_SAMMEL_CODE

    const parsedPricePublic = parseFloat(matching.basicPricePerUnit_PublicInsurance as string)
    const parsedPricePrivate = parseFloat(matching.basicPricePerUnit_PrivateInsurance as string)

    return (
      {
        id,
        name: `${matching?.artikelbezeichnung ?? ''}`,
        price: 0,
        basicPricePerUnit_PublicInsurance: parsedPricePublic,
        basicPricePerUnit_PrivateInsurance: parsedPricePrivate,
        amount: material.amount,
        isMedication,
        isSammelArticle,
        isSachkostenArticle,
        sammelFactor,
        unitOfMeasure,
        pzn,
        sammelCategory,
        supplierNumber,
        supplier,
      }
    )
  }

  aggregateOpItems (caseOPItems: ICaseOPItem[]) {
    const caseOPItemsFormatted = caseOPItems.reduce((acc, currentOpItem) => {
      if (!acc.find(opItem => opItem.id === currentOpItem.id)) {
        acc.push(currentOpItem)
      } else {
        const index = acc.findIndex(opItem => opItem.id === currentOpItem.id)
        acc[index].amount = acc[index].amount + currentOpItem.amount
      }
      return acc
    }, [])
    return caseOPItemsFormatted
  }

  getCaseMaterialsLogic (
    preOpSection: OpStandardPreOpSection | CasePreOpSection,
    intraOpSection: OpStandardIntraOpSection | CaseIntraOpSection,
    postOpSection: OpStandardPostOpSection | CasePostOpSection,
    materialAnagraphic: IAnagraphicVersion,
    supplierCodes: string[],
    contract: Contract,
    caseObj: Case,
  ) {
    const caseOPItems: ICaseOPItem[] = []

    const preOpMaterials = preOpSection.materials
      .map(item => this.tryParseCaseMaterial(item,
        materialAnagraphic,
        supplierCodes,
        false,
        contract,
        caseObj))

    const preOpMedications = preOpSection.medications
      .map(item => this.tryParseCaseMaterial(item,
        materialAnagraphic,
        supplierCodes,
        true,
        contract,
        caseObj))

    caseOPItems.push(...preOpMaterials)
    caseOPItems.push(...preOpMedications)

    Object.values(intraOpSection).forEach(value => {
      if (value.materials && value.medications) {
        // it's a CaseOpStandardStandardSection
        const materials = value.materials
          .map(item => this.tryParseCaseMaterial(item,
            materialAnagraphic,
            supplierCodes,
            false,
            contract,
            caseObj))

        const medications = value.medications
          .map(item => this.tryParseCaseMaterial(item,
            materialAnagraphic,
            supplierCodes,
            true,
            contract,
            caseObj))

        caseOPItems.push(...materials)
        caseOPItems.push(...medications)
      }
    })

    const postOpMaterials = Object.values(postOpSection.materials)
      .map((currentMaterial: CaseOpStandardMaterial | OpStandardMaterial) => this
        .tryParseCaseMaterial(currentMaterial,
          materialAnagraphic,
          supplierCodes,
          false,
          contract,
          caseObj))

    const postOpMedications = Object.values(postOpSection.medications)
      .map((currentMaterial: CaseOpStandardMedication | CaseOpStandardMedication) => this
        .tryParseCaseMaterial(currentMaterial,
          materialAnagraphic,
          supplierCodes,
          true,
          contract,
          caseObj))

    caseOPItems.push(...postOpMaterials)
    caseOPItems.push(...postOpMedications)

    const res = this.aggregateOpItems(caseOPItems)
    return res
  }

  async getCaseMaterialPrices (caseId: string, user: IUser, userPermissions: UserPermissions) {
    try {
      const caseObj = await this.caseModel.findById(caseId)
      const bookingDate = format(new Date(caseObj.bookingSection.date), dateString)

      const materialAnagraphic = await this.getAnagraphicVersion(
        anagraphicsTypes.MATERIALS_DATABASE,
        anagraphicsTypes.MATERIALS_DATABASE,
        bookingDate,
        userPermissions
      )
      const supplierCodes = await this.getSystemConfigPharmacySupplierCodes()

      const contract = await this.getContractById(
        caseObj.bookingSection.contractId,
        user,
        userPermissions
      )
      const opstandard = getCaseOpStandard({
        caseForm: caseObj as unknown as CaseForm,
        contracts: {
          [contract.contractId]: contract
        }
      })

      const caseMaterials = this.getCaseMaterialsLogic(opstandard.preOpSection,
        opstandard.intraOpSection,
        opstandard.postOpSection,
        materialAnagraphic,
        supplierCodes,
        contract,
        caseObj)
      const materialPrices: MaterialPrice[] = caseMaterials.map(materialItem => ({
        materialId: materialItem.id,
        materialName: materialItem.name,
        price: materialItem.price,
        amount: materialItem.amount,
      }))
      return materialPrices
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
