import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ClientProxy } from '@nestjs/microservices'
import {
  BillingCategory,
  Case,
  CaseIntraOpSection,
  CaseStatus,
  CasePostOpSection,
  CasePreOpSection,
  Component,
  Contract,
  GOAAnagraphic,
  IAnagraphicVersion,
  ICaseBilling,
  ICaseBillingSnapshot,
  ICaseOPItem,
  IEBMAnagraphic,
  IGeneralData,
  IParsedBG,
  IPricePointConfigs,
  IUser,
  IVATAnagraphic,
  IVatValue,
  InvoiceStatus,
  MaterialPrice,
  OpStandardIntraOpSection,
  OpStandardMaterial,
  OpStandardPostOpSection,
  OpStandardPreOpSection,
  UserPermissions,
  anagraphicsTypes,
  autoGuessCaseCategory,
  createCaseInvoiceBill,
  dateString,
  getCaseOpStandard,
  systemConfigurationSections,
  MEDICALS_SAMMEL_CODE,
  auditTrailCreate,
  EntityType,
  parseMaterialRowInCaseOPItem,
  InvoiceType,
  NumberingSystemTypes,
  IAddress,
  getPrice,
  ICaseBillProps,
  MissingInfo,
  computeCaseMissingInformations,
  checkMissingInfo,
  checkPermission,
  permissionRequests,
  CaseOpStandardMedication,
  CaseOpStandardMaterial,
  callMSWithTimeoutAndRetry,
  Steuerart,
  getNeededInvoices,
  IGeneratedInvoices,
  CaseAnesthesiaSection,
} from '@smambu/lib.constantsjs'
import { CaseBilling, CaseBillingDocument } from 'src/schemas/casebilling.schema'

import { ObjectId } from 'mongodb'
import { compareDesc, format } from 'date-fns'
import { BillobjService } from './billObj.service'
import { SnapshotService } from './snapshot.service'
import Translator from '@smambu/lib.constantsjs/lib/translator'
import { EnvConfigsService, LoggingService, RedisClientService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'
import { BillsObj } from 'src/schemas/billsObj.schema'
import { CaseBillingSnapshot } from 'src/schemas/casebillingsnapshot.schema'
import { GeneratedInvoice } from 'src/schemas/generatedInvoice.schema'
import { InvoicesCasesSnapshot } from 'src/schemas/invoiceCasesSnapshots'
import { SammelCheckpoint } from 'src/schemas/sammelCheckpoint.schema'

interface ICaseMaterial {
  code?: string
  materialId?: string
  medicationId?: string
  amount: number
}
@Injectable()
export class BillingService {
  private readonly models: { model: Model<any>; label: string }[]
  constructor (
    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,
    @Inject('CONTRACT_CLIENT')
    private readonly contractClient: ClientProxy,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    @Inject('CASES_CLIENT')
    private readonly caseClient: ClientProxy,
    @Inject('ANAGRAPHICS_CLIENT')
    private readonly anagraphicsClient: ClientProxy,

    @Inject(BillobjService)
    private readonly billObjClient: BillobjService,

    @Inject(SnapshotService)
    private readonly snapshotClient: SnapshotService,

    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,

    @InjectModel(CaseBilling.name)
    private readonly billsModel: Model<CaseBilling>,
    @InjectModel(BillsObj.name)
    private readonly billObjModel: Model<BillsObj>,
    @InjectModel(CaseBillingSnapshot.name)
    private readonly snapshotModel: Model<CaseBillingSnapshot>,
    @InjectModel(GeneratedInvoice.name)
    private readonly generatedInvoiceModel: Model<GeneratedInvoice>,
    @InjectModel(InvoicesCasesSnapshot.name)
    private readonly invoicesCasesSnapshot: Model<InvoicesCasesSnapshot>,
    @InjectModel(SammelCheckpoint.name)
    private readonly sammelCheckpointModel: Model<SammelCheckpoint>,

    @Inject(RedisClientService)
    private readonly redis: RedisClientService,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BILLING)
    this.models = [
      { model: this.billObjModel, label: 'billsobjs' },
      { model: this.billsModel, label: 'casebillings' },
      { model: this.snapshotModel, label: 'casebillingsnapshots' },
      { model: this.generatedInvoiceModel, label: 'generatedinvoices' },
      { model: this.invoicesCasesSnapshot, label: 'invoicescasessnapshots' },
      { model: this.sammelCheckpointModel, label: 'sammelcheckpoints' },
    ]
  }

  async createOrUpdateBillingDocument (data: Partial<CaseBillingDocument>, userId: string) {
    try {
      // we do not allow for duplicate bills for a case
      const newBill = await this.billsModel.findOneAndUpdate({
        caseId: data.caseId
      }, {
        ...data,
        missingData: data?.missingData ?? [],
        missingItems: data?.missingItems ?? [],
      }, { upsert: true, new: true })

      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.CASEBILL,
        newObj: newBill.toJSON(),
      })
      return newBill
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getOne (billId: string, userPermissions: UserPermissions) {
    try {
      const billingDocument = await this.billsModel.findById({ _id: new ObjectId(billId) })
      const caseItem = await this.getCaseById(billingDocument.caseId, null, userPermissions)

      checkPermission(permissionRequests.canViewBill, { userPermissions, props: { caseItem } })

      return billingDocument
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findByCaseId (caseId: string) {
    try {
      const billingDocument = await this.billsModel.findOne({ caseId })

      return billingDocument
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findMultipleByCaseId (caseIds: string[]) {
    try {
      const billingDocuments = await this.billsModel.find({ caseId: { $in: caseIds } })

      return billingDocuments
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateBillingDocument (bill: CaseBillingDocument) {
    try {
      const updated = await this.billsModel.findOneAndUpdate({
        _id: new ObjectId(bill._id)
      }, bill, { new: true })

      return updated
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCaseById (caseId: string, user: IUser,
    userPermissions: UserPermissions, permissionCheck: boolean = true): Promise<Case> {
    try {
      const pattern = { role: 'cases', cmd: 'getCasebyId' }

      const payloadData = {
        caseId,
        user,
        userPermissions,
        permissionCheck
      }
      const caseObj = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return caseObj
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesById (casesIds: string[],
    userPermissions: UserPermissions) {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesbyId' }

      const payloadData = {
        casesIds,
        userPermissions
      }
      const caseObj = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return caseObj
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getMostRecentCaseInIds (casesIds: string[],
    userPermissions: UserPermissions) {
    try {
      const pattern = { role: 'cases', cmd: 'getMostRecentCaseInIds' }

      const payloadData = {
        casesIds,
        userPermissions
      }
      const caseObj = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return caseObj
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async setCasesBilledExternally (caseIds: string[], user: IUser,
    userPermissions: UserPermissions): Promise<Case> {
    try {
      const pattern = { role: 'cases', cmd: 'setBilledExternally' }

      const payloadData = {
        caseIds,
        user,
        userPermissions
      }
      const caseObj = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return caseObj
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateCaseBilledStatus (caseIds: string[], isCancellation: boolean = false) {
    try {
      const billingDocuments = await this.findMultipleByCaseId(caseIds)

      const promises = billingDocuments.map(currentDocument => {
        return this.billObjClient.findManyByIds(currentDocument.bills).then(billObj => {
          const desiredState = isCancellation ? InvoiceStatus.CANCELLED : InvoiceStatus.EMITTED

          const firstNotInDesiredState = billObj
            .find(bill => bill.status !== desiredState)

          const allInDesiredState = firstNotInDesiredState === undefined

          const allInStatus = isCancellation ? CaseStatus.REVIEWED : CaseStatus.BILLED

          const pattern = { role: 'cases', cmd: 'updateCaseStatus' }

          const payloadData = {
            caseId: currentDocument.caseId,
            status: allInDesiredState ? allInStatus : CaseStatus.PARTIALLY_BILLED
          }
          return callMSWithTimeoutAndRetry(this.caseClient,
            pattern,
            payloadData,
            Component.BILLING)
        })
      })

      await Promise.all(promises)

      return 'done'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getContractById (
    contractId: string,
    user: IUser,
    userPermissions: UserPermissions,
    permissionCheck: boolean = false,
    noSurgerySlots: boolean = false
  ): Promise<Contract> {
    try {
      const pattern = { role: 'contracts', cmd: 'getContract' }

      const payloadData = {
        id: contractId,
        userPermissions,
        user,
        permissionCheck,
        noSurgerySlots,
      }
      const contract = await callMSWithTimeoutAndRetry(this.contractClient,
        pattern,
        payloadData,
        Component.BILLING)

      return contract
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getSystemConfigGeneralData (): Promise<IGeneralData> {
    try {
      const pattern = { role: 'SystemConfigurationSection', cmd: 'get' }

      const payloadData = {
        section: systemConfigurationSections.GENERAL_DATA
      }
      const generalData = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        payloadData,
        Component.BILLING)

      return generalData?.data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getSystemConfigPricePoints (): Promise<IPricePointConfigs> {
    try {
      const pattern = { role: 'SystemConfigurationSection', cmd: 'get' }

      const payloadData = {
        section: systemConfigurationSections.PRICE_POINT_CONFIGS
      }
      const pricePoints = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        payloadData,
        Component.BILLING)

      return pricePoints?.data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getSystemConfigVatValues (): Promise<IVatValue[]> {
    try {
      const pattern = { role: 'SystemConfigurationSection', cmd: 'get' }

      const payloadData = {
        // @ts-expect-error DYNAMIC DATA IS BROKEN
        section: systemConfigurationSections.VAT_VALUE_CONFIGS
      }
      const vatValues = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        payloadData,
        Component.BILLING)

      return vatValues?.data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
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
        Component.BILLING)

      return supplierCodes?.data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAnagraphicVersion (anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    date,
    userPermissions) {
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
      Component.BILLING)
  }

  getGOANeededType (category: BillingCategory) {
    switch (category) {
      case BillingCategory.A:
        return anagraphicsTypes.GOACATA
      case BillingCategory.B:
        return anagraphicsTypes.GOACATB
      default:
        return null
    }
  }

  getGOAAnagraphic (
    caseObj: Case,
    goaAnagraphic: IAnagraphicVersion,
    missingData: string[],
    missingItems: string[],
  ) {
    const result = <GOAAnagraphic>{}

    const matched = checkMissingInfo(
      // @ts-expect-error DYNAMIC DATA IS BROKEN
      goaAnagraphic?.rows?.find(row => row.number === caseObj.billingSection.goaNumber),
      MissingInfo.billingSection.matchingGOA,
      missingData,
      missingItems,
      ['']
    )

    if (matched) {
      result.goaNumber = `${matched.number}`
      result.type = anagraphicsTypes.GOACATA
      result.price = Number(matched.price) || undefined
      result.description = `${matched.description}`
    }
    return result
  }

  tryGetBG (translator: Translator, caseObj: Case, bgAnagraphic: IAnagraphicVersion) {
    const parsedBG = <IParsedBG>{}
    // @ts-expect-error DYNAMIC DATA IS BROKEN
    const customBG = caseObj?.bookingSection?.customBG

    const address = <IAddress>{}
    // @ts-expect-error DYNAMIC DATA IS BROKEN
    if (!caseObj?.bookingSection?.bgId && customBG) {
      parsedBG.debtorNumber = customBG.bgDebtorNumber
      parsedBG.firstName = customBG.name
      parsedBG.lastName = customBG.surname

      // customBG.address is used for retrocompability
      address.street = customBG.street ?? customBG.address
      address.houseNumber = customBG.streetNumber ?? customBG.address
      address.postalCode = customBG.postalCode ?? customBG.address
      address.city = customBG.city
      address.country = customBG.country

      parsedBG.address = address

      parsedBG.isCustom = true

      return parsedBG
    }

    if (bgAnagraphic) {
      // @ts-expect-error DYNAMIC DATA IS BROKEN
      const bgId = caseObj?.bookingSection?.bgId

      if (bgId) {
        const matched = bgAnagraphic?.rows?.find(row => row.nummer === bgId)

        if (!matched)
          return null

        if (!matched?.debtorNumber) throw new Error(translator.fromLabel('no_bg_DebtorNumber_match', { bgId }))

        parsedBG.debtorNumber = matched.debtorNumber.toString()
        parsedBG.firstName = matched?.langtext?.toString?.() ?? ''
        parsedBG.lastName = '-'

        // bg anagraphic address has streetNumber instead of houseNumber, so i used this interface instead of IAddress
        const matchedAaddress = matched?.address as unknown as {
          street: string
          streetNumber: string
          postalCode: string
          city: string
          country: string
        }

        address.street = matchedAaddress?.street?.toString?.() ?? ''
        address.houseNumber = matchedAaddress?.streetNumber?.toString?.() ?? ''
        address.postalCode = matchedAaddress?.postalCode?.toString?.() ?? ''
        address.city = matchedAaddress?.city?.toString?.() ?? ''
        address.country = matchedAaddress?.country?.toString?.() ?? ''

        parsedBG.address = address

        parsedBG.isCustom = false

        return parsedBG
      }
    }

    return null
  }

  tryParseEBMAnagraphic (
    opsCode: string,
    opsAnagraphic: IAnagraphicVersion,
    ebmAnagraphic: IAnagraphicVersion,
    pricePoints,
    missingItems: string[],
    missingData: string[],
  ) {
    const parsedEBM = <IEBMAnagraphic>{}

    // EBMItem: retrieved from the OPSCode anagraphics, by searching case.OPSCode in the OPS column
    // categoryNumber: EBMItem.Kategorie extracting the digit (e.g. from category C1B we extract 1)
    // points: retrieved from the EBMPoints anagraphics, column Punktzahl,
    // by searching EBMItem.ambulanteOperation in the EBM-Ziffer column

    // pricePerPoint: retrieved from systemConfiguration.pointPrices

    const matchedOPS = opsAnagraphic?.rows?.find(row => row.ops === opsCode)

    if (matchedOPS) {
      const rawCategory = `${matchedOPS.kategorie}`
      const categoryRE = /(?<=[a-zA-Z]|^)\d+(?=[a-zA-Z]|$)/
      const reMatch = rawCategory.match(categoryRE)
      const category = reMatch?.[0]
      const categoryNumber = checkMissingInfo(
        category,
        MissingInfo.opsAnagraphic.categoryNumber,
        missingData,
        missingItems,
        ['']
      )

      const ambulanteOperation = checkMissingInfo(
        matchedOPS.ambulanteOperation,
        MissingInfo.opsAnagraphic.ambulanteOperation,
        missingData,
        missingItems,
        ['']

      )

      const matchedEBM = checkMissingInfo(
        ebmAnagraphic?.rows?.find(row => row.ebmZiffer === ambulanteOperation),
        MissingInfo.opsAnagraphic.matchingEBM,
        missingData,
        missingItems,
        ['']
      )

      if (matchedEBM) {
        parsedEBM.opsCode = opsCode
        parsedEBM.categoryNumber = Number(categoryNumber) || undefined
        parsedEBM.points = Number(matchedEBM.punktzahl) || undefined
        parsedEBM.pricePerPoints = pricePoints?.pricePoint
        parsedEBM.description = matchedEBM?.ebmBezeichnung as string

        return parsedEBM
      }
    } else {
      checkMissingInfo(null, MissingInfo.ebmAnagraphic.ebmAnagraphic, missingData, missingItems)

      return {
        pricePerPoints: pricePoints?.pricePoint,
      }
    }
  }

  tryParseCaseMaterial (material: ICaseMaterial,
    feParsedVersion: IAnagraphicVersion,
    supplierCodes: string[],
    isMedication: boolean = false,
    contract: Contract,
    caseObj: Case): ICaseOPItem {
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

    const price = getPrice(parseMaterialRowInCaseOPItem(matching))

    return (
      {
        id,
        name: `${matching?.artikelbezeichnung ?? ''}`,
        price,
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

  tryParseVATAnagraphic (
    materialAnagraphic: IAnagraphicVersion,
    caseOPItems: ICaseOPItem[],
    refDate: Date | string,
    vatValues: IVatValue[],
    extraMaterials: ICaseOPItem[]
  ) {
    // vatItem: retrieved from the ArticleVATType anagraphics searching the item.code in the Artikelnummer column
    // netPrice: calculated depending on vatItem.steuerart, using
    // if vatItem.steuerart = VOLLER SATZ: item.price / (100% + systemConfiguration.fullVatPercentage) * 100
    // if vatItem.steuerart = ERMÄßIGTER SATZ: item.price / (100% + systemConfiguration.reducedVatPercentage) * 100
    const result: IVATAnagraphic[] = []

    const parseVatValues = vatValues?.map(vatValue => ({
      ...vatValue,
      validFrom: new Date(vatValue.validFrom),
    }))

    // XXX TODO: carefull, types are very broken: vatvalues are marked as array,
    // but the function that gets them can (and will) return undefined at times
    // eslint-disable-next-line etc/no-assign-mutated-array
    parseVatValues?.sort((a, b) => compareDesc(a.validFrom, b.validFrom))

    const validVat = parseVatValues
      ?.find(vatValue => {
        const actualDate = new Date(refDate)
        const startDate = new Date(vatValue.validFrom)

        return actualDate >= startDate
      })

    caseOPItems.forEach(item => {
      const matched = materialAnagraphic?.rows?.find(row => row.artikelnummer === item.id)

      if (matched) {
        const vatItem = <IVATAnagraphic>{}

        vatItem.itemCode = item.id
        vatItem.fullVatPercentage = validVat?.fullPercentage
        vatItem.reducedVatPercentage = validVat?.halfPercentage
        vatItem.steuerart = Object.values(Steuerart).includes(matched?.steuerart as Steuerart)
          ? matched?.steuerart as string
          : null

        result.push(vatItem)
      }
    })

    extraMaterials?.forEach(item => {
      const matched = materialAnagraphic?.rows?.find(row => row.artikelnummer === item.id)

      if (matched) {
        const vatItem = <IVATAnagraphic>{}

        vatItem.itemCode = item.id
        vatItem.fullVatPercentage = validVat?.fullPercentage
        vatItem.reducedVatPercentage = validVat?.halfPercentage
        vatItem.steuerart = Object.values(Steuerart).includes(matched?.steuerart as Steuerart)
          ? matched?.steuerart as string
          : null

        result.push(vatItem)
      }
    })

    return result
  }

  checkGeneralData (generalData: IGeneralData, missingData: string[], missingItems: string[]) {
    Object.entries(MissingInfo.systemConfig.generalData).forEach(([key, value]) => {
      checkMissingInfo(
        generalData?.[key],
        value,
        missingData,
        missingItems,
        ['']
      )
    })
  }

  async getDataForSnapshot (
    caseId: string,
    user: IUser | null,
    userPermissions: UserPermissions,
    updatedCase?: Case,
  ): Promise<{ caseBillSnapshot: ICaseBillingSnapshot, caseBillProps: ICaseBillProps }> {
    try {
      const translator = await this.envConfigClient.getTranslator()

      const missingItems = []
      const missingData = []
      if (!updatedCase && !user)
        // this should never happen, as no user is provided only when automatically updating cases
        throw new BadRequestException('No user provided and no updated case provided')

      const caseObj = updatedCase ?? await this.getCaseById(caseId, user, userPermissions)
      // @ts-expect-error DYNAMIC DATA IS BROKEN
      let bills = caseObj?.billingDocument?.bills

      if (bills == null) {
        const billingDocument = await this.findByCaseId(caseId)
        if (billingDocument != null)
          bills = await this.billObjClient.findManyByIds(billingDocument.bills)
      }

      const generalData = await this.getSystemConfigGeneralData()
      // TODO: this check, like all the MissingInfo() in this function, should be moved to computeCaseMissingInformations
      this.checkGeneralData(generalData, missingData, missingItems)

      const pricePoints = await this.getSystemConfigPricePoints()
      const vatValues = await this.getSystemConfigVatValues()
      const supplierCodes = await this.getSystemConfigPharmacySupplierCodes()

      // here we are not using the snapshot of the contract because we need updated data
      const contract = await this.getContractById(
        caseObj.bookingSection.contractId,
        user,
        userPermissions,
        false,
        true,
      )
      delete contract.details.surgerySlots
      const opStandardId = caseObj.bookingSection.opStandardId

      contract.opStandards = Object.entries(contract.opStandards)
        .filter(([id]) => id === opStandardId)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

      const autoCategory = autoGuessCaseCategory(translator, caseObj, contract)

      // @ts-expect-error DYNAMIC DATA IS BROKEN
      const category = caseObj.billingSection.billingCategory ?? autoCategory

      const booking = caseObj.bookingSection
      const bookingDate = format(new Date(booking.date), dateString)

      const goaNeededType = this.getGOANeededType(category)

      let goaAnagraphic
      if (goaNeededType) {
        const goaAnagraphicRows = await this.getAnagraphicVersion(anagraphicsTypes.GOA,
          goaNeededType,
          bookingDate,
          userPermissions)

        goaAnagraphic = this.getGOAAnagraphic(caseObj, goaAnagraphicRows, missingData, missingItems)
      }

      const bgAnagraphicRows = await this.getAnagraphicVersion(anagraphicsTypes.INSURANCES,
        anagraphicsTypes.BGINSURANCES,
        bookingDate,
        userPermissions)

      const parsedBG = this.tryGetBG(translator, caseObj, bgAnagraphicRows)

      // @ts-expect-error DYNAMIC DATA IS BROKEN
      const opsCode = caseObj.billingSection?.opsCode
      const opsAnagraphic = await this.getAnagraphicVersion(anagraphicsTypes.OPSCATALOGUE,
        anagraphicsTypes.OPSCATALOGUE,
        bookingDate,
        userPermissions)

      let ebmAnagraphic

      if (category === BillingCategory.E) {
        const rawEbmAnagraphic = await this.getAnagraphicVersion(
          anagraphicsTypes.EBM,
          anagraphicsTypes.EBM,
          bookingDate,
          userPermissions
        )

        ebmAnagraphic = this.tryParseEBMAnagraphic(
          opsCode,
          opsAnagraphic,
          rawEbmAnagraphic,
          pricePoints,
          missingItems,
          missingData,
        )
      }

      const materialAnagraphic = await this
        .getAnagraphicVersion(anagraphicsTypes.MATERIALS_DATABASE,
          anagraphicsTypes.MATERIALS_DATABASE,
          bookingDate,
          userPermissions)

      const caseOPItems: ICaseOPItem[] = this.getCaseMaterialsLogic(caseObj.preOpSection,
        caseObj.intraOpSection,
        caseObj.postOpSection,
        materialAnagraphic,
        supplierCodes,
        contract,
        caseObj)

      const anesthesiaOPItems: ICaseOPItem[] = this
        .getAnesthesiaMaterials(caseObj.anesthesiaSection,
          materialAnagraphic,
          supplierCodes,
          contract,
          caseObj)

      const externalMaterialPrices = bills?.reduce((acc, bill) => {
        const extraMaterials = bill.extraMaterials
          .map(extraMaterial => this.tryParseCaseMaterial(extraMaterial,
            materialAnagraphic,
            supplierCodes,
            false,
            contract,
            caseObj))

        if (bill?.extraMaterials?.length)
          return [
            ...acc,
            ...extraMaterials]
        else
          return acc
      }, [])

      const allItems = [...caseOPItems, ...anesthesiaOPItems].reduce((acc: ICaseOPItem[], curr) => {
        if (!acc.find(item => item.id === curr.id)) acc.push(curr)
        return acc
      }, [])

      const vatAnagraphic = this.tryParseVATAnagraphic(materialAnagraphic,
        allItems,
        booking.date,
        vatValues,
        externalMaterialPrices)

      computeCaseMissingInformations(category, caseObj, missingItems, missingData)

      const snapshot = {
        createdAt: new Date(),
        updatedAt: new Date(),
        case: caseObj,
        contract,
        goaAnagraphic,
        caseOPItems,
        externalMaterialPrices,
        parsedBG,
        ebmAnagraphic,
        vatAnagraphic,
        generalData,
        missingItems,
        missingData,
        anesthesiaOPItems,
        tenantId: user != null ? user.tenantId : updatedCase.tenantId,
      }

      const caseBillProps = {
        missingItems,
        missingData,
      }

      const { caseBillSnapshot } = createCaseInvoiceBill(translator, snapshot)

      return { caseBillSnapshot, caseBillProps }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
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

  getAnesthesiaMaterials (
    anesthesiaSection: CaseAnesthesiaSection,
    materialAnagraphic: IAnagraphicVersion,
    supplierCodes: string[],
    contract: Contract,
    caseObj: Case,
  ) {
    const caseOPItems: ICaseOPItem[] = []

    const anesthesiaMaterials = anesthesiaSection.materials
      .map(item => this.tryParseCaseMaterial(item,
        materialAnagraphic,
        supplierCodes,
        false,
        contract,
        caseObj))
    const anesthesiaMedications = anesthesiaSection.medications
      .map(item => this.tryParseCaseMaterial(item,
        materialAnagraphic,
        supplierCodes,
        true,
        contract,
        caseObj))
    const anesthesiaVentilationMaterials = anesthesiaSection.ventilationMaterials
      .map(item => this.tryParseCaseMaterial(item,
        materialAnagraphic,
        supplierCodes,
        false,
        contract,
        caseObj))

    caseOPItems.push(...anesthesiaMaterials)
    caseOPItems.push(...anesthesiaMedications)
    caseOPItems.push(...anesthesiaVentilationMaterials)

    return this.aggregateOpItems(caseOPItems)
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

  async getCaseMaterialPrices (caseId: string, user: IUser, userPermissions: UserPermissions) {
    try {
      const caseObj = await this.getCaseById(caseId, user, userPermissions)
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
        caseForm: caseObj,
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

  async deleteOne (id) {
    try {
      await this.billsModel.deleteOne(id)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutAnesthesiologistPresence (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutAnesthesiologistPresence' }

      const payloadData = { caseId }
      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findManyByBillObjIds (billObjIds: string[]) {
    try {
      const billingDocuments = await this.billsModel.find({ bills: { $in: billObjIds } })

      return billingDocuments
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getInvoiceNumber (invoice: IGeneratedInvoices) {
    try {
      let assignedInvoiceType

      if (invoice.type === InvoiceType.CREDIT_NOTE && invoice.originalInvoiceType == null)
        throw new Error('error_original_invoice_type_undefined')

      const invoiceType = invoice.type !== InvoiceType.CREDIT_NOTE
        ? invoice.type
        : invoice.originalInvoiceType

      switch (invoiceType) {
        case InvoiceType.CHARGE_ABGABE:
          assignedInvoiceType = NumberingSystemTypes.CHARGE_ABGABE
          break

        case InvoiceType.SACHKOSTEN:
          assignedInvoiceType = NumberingSystemTypes.SACHKOSTEN
          break

        case InvoiceType.ANAESTHESIA:
          assignedInvoiceType = NumberingSystemTypes.ANAESTHESIA
          break

        case InvoiceType.MATERIAL_PRIVATE:
          assignedInvoiceType = NumberingSystemTypes.MATERIAL_PRIVATE
          break

        case InvoiceType.PLASTIC_SURGERY:
          assignedInvoiceType = NumberingSystemTypes.PLASTIC_SURGERY
          break

        case InvoiceType.PLASTIC_SURGERY_VAT:
          assignedInvoiceType = NumberingSystemTypes.PLASTIC_SURGERY_VAT
          break

        case InvoiceType.SELF_PAYER:
          assignedInvoiceType = NumberingSystemTypes.SELF_PAYER
          break

        case InvoiceType.PC_MATERIALS:
          assignedInvoiceType = NumberingSystemTypes.PC_MATERIALS
          break

        case InvoiceType.OVERNIGHT_STAY:
          assignedInvoiceType = NumberingSystemTypes.OVERNIGHT_STAY
          break

        default:
          throw new BadRequestException('unsupported_invoice_type')
      }
      const pattern = { role: 'invoiceNumber', cmd: 'get' }

      const payloadData = { type: assignedInvoiceType }

      return await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        payloadData,
        Component.BILLING)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithotAnesthesiologistPresence () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithotAnesthesiologistPresence' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithoutDoctor () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithoutDoctor' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutDoctor (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutDoctor' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithoutContractSnapshot () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithoutContractSnapshot' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutContractSnapshot (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutContractSnapshot' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCaseswithBookingDateOfTypeString () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithBookingDateOfTypeString' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCasewithBookingDateOfTypeString (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCasewithBookingDateOfTypeString' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithoutOpstandardsArray () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithoutOpstandardsArray' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutOpstandardsArray (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutOpstandardsArray' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithMoreThanOneOp () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithMoreThanOneOp' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithMoreThanOneOp (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithMoreThanOneOp' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithoutNeededInvoiceTypes () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithoutNeededInvoiceTypes' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutNeededInvoiceTypes (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutNeededInvoiceTypes' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithoutBillingCategory () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithoutBillingCategory' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutBillingCategory (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutBillingCategory' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithoutMissingInfo () {
    try {
      const pattern = { role: 'cases', cmd: 'getCasesWithoutMissingInfo' }

      const cases = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        {},
        Component.BILLING)

      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutMissingInfo (caseId: string) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutMissingInfo' }

      const payloadData = { caseId }
      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeCaseWithoutReviewDone (caseObj: Case) {
    try {
      const pattern = { role: 'cases', cmd: 'normalizeCaseWithoutReviewDone' }

      const result = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        caseObj,
        Component.BILLING)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createNewOrUpdateBillingDocument (data: ICaseBilling,
    user: IUser,
    userPermissions: UserPermissions,
    caseObj?: Case) {
    let billingDocumentWithBillobjs

    await this.redis.redislock
      .using([`createNewOrUpdateBillingDocument-${data.caseId}`], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const { caseBillSnapshot, caseBillProps } = await this.getDataForSnapshot(
          data.caseId,
          user,
          userPermissions,
          caseObj
        )

        const oldBillingDocument = await this.findByCaseId(data.caseId)
        const newBillingDocument = await this.createOrUpdateBillingDocument({
          ...data,
          ...caseBillProps,
          ...(oldBillingDocument?.bills?.length > 0 && {
            bills: oldBillingDocument.bills
          }),
          snapshot: null,
        }, user.id)

        try {
          let snapshot
          const oldSnapshot = await this.snapshotClient.findByCaseId(data.caseId)
          if (oldSnapshot == null)
            snapshot = await this.snapshotClient.createOne(caseBillSnapshot, user.id)
          else
            snapshot = await this.snapshotClient.updateByCaseId(caseBillSnapshot,
              data.caseId,
              user.id)

          const neededInvoiceTypes = getNeededInvoices(caseBillSnapshot.case)

          const oldBillObjs = newBillingDocument.bills
            ? await this.billObjClient.findManyByIds(newBillingDocument.bills)
            : null

          const invoicesTypesToCreate = neededInvoiceTypes
            .filter(type => !oldBillObjs.some(b => b.type === type))

          let newBillObjs = []

          if (invoicesTypesToCreate.length > 0) {
            const billObjs = await this.billObjClient
              .createNeededWithTypes(snapshot.toObject(), user.id, invoicesTypesToCreate)
            newBillObjs.push(...billObjs)
          }

          if (oldBillObjs != null && oldBillObjs.length > 0)
            await this.billObjClient.updateManyByBillObj(oldBillObjs)

          newBillObjs.forEach(billObj => newBillingDocument.bills.push(billObj.id))

          newBillingDocument.snapshot = snapshot.id

          await this.updateBillingDocument(newBillingDocument)

          billingDocumentWithBillobjs = await this.billObjClient
            .populateBillingDocumentWithBillingObjects(newBillingDocument)

          return billingDocumentWithBillobjs
        } catch (e) {
          await this.deleteOne(newBillingDocument.id)

          throw e
        }
      })

    return billingDocumentWithBillobjs
  }

  async deleteByCaseId (caseId: string) {
    try {
      await this.billsModel.deleteMany({ caseId })
      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async generateIds (data: Record<string, any[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async resetData (data: Record<string, any[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
