import { MEDICALS_SAMMEL_CODE } from '../constants'
import { CaseStatus, MissingInfo } from '../enums'
import Translator from '../translator'
import { Case, EPcMaterialsStatus, IAnagraphicVersion, ICaseOPItem, IPcMaterial, ISammelCheckpoint, ISammelPosition, IUser, ParsedSammel, Patient } from '../types'
import { billPatientFromPatient, debtorFromSurgeon } from './debtor-utilities'
import { checkMissingInfo } from './generic-utilities'

interface ICaseMaterial {
  code?: string
  materialId?: string
  medicationId?: string
  amount: number
}

const aggregateOpItems = (caseOPItems: ICaseOPItem[]) => {
  const caseOPItemsFormatted = caseOPItems.reduce((acc, currentOpItem) => {
    if (!acc.find(opItem => opItem.id === currentOpItem.id)) {
      acc.push(currentOpItem)
    } else {
      const index = acc.findIndex(opItem => opItem.id === currentOpItem.id)
      acc[index].amount = acc[index].amount + currentOpItem.amount
    }
    return acc
  }, [] as ICaseOPItem[])
  return caseOPItemsFormatted
}

const tryParseCaseMaterial = (
  material: ICaseMaterial,
  feParsedVersion: IAnagraphicVersion,
  supplierCodes: string[],
  isMedication: boolean = false,
): ICaseOPItem | null => {
  const id = material.code ?? material.materialId ?? material.medicationId

  if (!id) throw new Error('material_without_id_error')

  const matching = feParsedVersion?.rows?.find(row => row.artikelnummer === id)

  if (!matching) return null

  const isSammelArticle = matching.sprechstundenbedarf as boolean

  if (!isSammelArticle) return null

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

export const getCasePcMaterials = (
  materialAnagraphic: IAnagraphicVersion,
  supplierCodes: string[],
  caseItem: Case,
) => {
  const caseOPItems: (ICaseOPItem | null)[] = []

  const preOpMaterials = caseItem.preOpSection.materials
    .map(item => tryParseCaseMaterial(
      item,
      materialAnagraphic,
      supplierCodes,
      false,
    ))

  const preOpMedications = caseItem.preOpSection.medications
    .map(item => tryParseCaseMaterial(
      item,
      materialAnagraphic,
      supplierCodes,
      true,
    ))

  caseOPItems.push(...preOpMaterials)
  caseOPItems.push(...preOpMedications)

  Object.values(caseItem.intraOpSection)
    .forEach(value => {
      if (value.materials && value.medications) {
        const materials = value.materials
          .map((item: ICaseMaterial) => tryParseCaseMaterial(
            item,
            materialAnagraphic,
            supplierCodes,
            false,
          ))

        const medications = value.medications
          .map((item: ICaseMaterial) => tryParseCaseMaterial(
            item,
            materialAnagraphic,
            supplierCodes,
            true,
          ))

        caseOPItems.push(...materials)
        caseOPItems.push(...medications)
      }
    })

  const postOpMaterials = Object.values(caseItem.postOpSection.materials)
    .map(currentMaterial =>
      tryParseCaseMaterial(
        currentMaterial,
        materialAnagraphic,
        supplierCodes,
        false,
      ))

  const postOpMedications = Object.values(caseItem.postOpSection.medications)
    .map(currentMaterial => tryParseCaseMaterial(
      currentMaterial,
      materialAnagraphic,
      supplierCodes,
      true,
    ))

  caseOPItems.push(...postOpMaterials)
  caseOPItems.push(...postOpMedications)

  const res = aggregateOpItems(caseOPItems.filter(item => item !== null) as ICaseOPItem[])
  return res
}

export const calculatePcMaterial = (
  translator: Translator,
  caseItem: Case,
  doctor: IUser,
  materialAnagraphic: IAnagraphicVersion,
  supplierCodes: string[],
  patient: Patient | null,
  oldData: IPcMaterial | null,
): Omit<IPcMaterial, '_id'> => {
  const missingData: string[] = []
  const missingItems: string[] = []

  const pcMaterialsItems = getCasePcMaterials(materialAnagraphic, supplierCodes, caseItem)

  const positions = pcMaterialsItems
    .map(current => {
      const position = <ISammelPosition>{ date: new Date() }

      position.amount = current.amount
      const positionDefaultLabel = `${current.id} - ${translator.fromLabel('opStandardTable_missing_material')}`
      position.description =
        checkMissingInfo(
          current.name,
          MissingInfo.materialsDatabase.material.name(current.id),
          missingData,
          missingItems,
          [''],
        ) ?? positionDefaultLabel

      position.sammelFactor =
        checkMissingInfo(
          current.sammelFactor,
          MissingInfo.materialsDatabase.material.sammelFactor(current.id),
          missingData,
          missingItems,
          [0, NaN],
        ) ?? 0

      checkMissingInfo(
        !(current.isSachkostenArticle && current.isSammelArticle),
        MissingInfo.materialsDatabase.sammelSachkostenConflict(current.id),
        missingData,
        missingItems,
        [false],
      )

      position.itemCode = checkMissingInfo(
        current.id,
        MissingInfo.materialsDatabase.material.id(current.id),
        missingData,
        missingItems,
        [''],
      )

      position.sammelCategory = current.sammelCategory ?? MEDICALS_SAMMEL_CODE
      position.materialId = current.id

      position.unitOfMeasure = current.unitOfMeasure ?? ''
      position.pzn = current.pzn ?? ''
      position.supplierNumber = current.supplierNumber ?? ''
      position.supplier = current.supplier ?? ''

      return position
    })

  const debtor = debtorFromSurgeon(doctor, missingData, missingItems)
  const patientData = billPatientFromPatient(patient!, missingData, missingItems)

  const getStatus = () => {
    if (missingData.length || missingItems.length) return EPcMaterialsStatus.INFORMATION_INCOMPLETE
    if (oldData?.status === EPcMaterialsStatus.PROCESSED) return EPcMaterialsStatus.PROCESSED

    if (oldData?.reviewed || caseItem.status === CaseStatus.REVIEWED)
      return EPcMaterialsStatus.READY

    return EPcMaterialsStatus.NOT_READY
  }

  const status = getStatus()
  const reviewed = oldData?.reviewed ?? caseItem.status === CaseStatus.REVIEWED // We want to keep the old value if it exists
  const cancelled = oldData?.cancelled ?? false // We want to keep the old value if it exists

  const pcMaterial = {
    caseId: caseItem.caseId,
    status,
    debtor,
    patient: patientData,
    positions,
    missingData,
    missingItems,
    elaborationInProgress: false,
    reviewed,
    cancelled,
  }

  return pcMaterial
}

export const filterEmittablePcMaterials = (
  pcMaterials: IPcMaterial[],
  previousCheckpoint: ISammelCheckpoint | undefined,
) => {
  const positionsArticles = getParsedArticlesFromPcMaterials(pcMaterials)

  const emittablePcMaterials = pcMaterials.filter(({ positions }) => {
    const emittables = positions.filter(position => {
      if (position.materialId == null) throw new Error('materialId cannot be undefined')

      const reminder = (previousCheckpoint?.consumptions
        ?.find?.(c => c.itemCode === position.materialId)?.remainder ?? 0)

      const totalWithReminder = positionsArticles[position.materialId].total + reminder

      const factor = positionsArticles[position.materialId].factor
      return totalWithReminder >= factor
    })
    return emittables.length > 0
  })

  return emittablePcMaterials
}

export const getParsedArticlesFromPcMaterials = (pcMaterials: IPcMaterial[]) => {
  const positionsArticles: {
    [key: string]: ParsedSammel
  } = {}

  for (const pcMaterial of pcMaterials) {
    const positions = pcMaterial.positions
    for (const position of positions) {
      if (position.materialId == null) throw new Error('materialId cannot be undefined')
      positionsArticles[position.materialId] = {
        total: (positionsArticles?.[position.materialId]?.total ?? 0) + position.amount,
        factor: position.sammelFactor,
        materialId: position.materialId,
        description: position.description,
      }
    }
  }
  return positionsArticles
}
