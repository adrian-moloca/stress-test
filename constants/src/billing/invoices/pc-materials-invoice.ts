import { MEDICALS_SAMMEL_CODE } from '../../constants'
import { MissingInfo, RecipientType } from '../../enums'
import Translator from '../../translator'
import { IBillObj, ICaseOPItem, ISammelPosition, IUser, Patient } from '../../types'
import { billPatientFromPatient, debtorFromSurgeon } from '../debtor-utilities'
import { checkMissingInfo } from '../generic-utilities'

export const computePCMaterialsInvoice = (
  translator: Translator,
  billObj: IBillObj,
  surgeon: IUser,
  patient: Patient,
  caseOPItems: ICaseOPItem[],
) => {
  const missingData: string[] = []
  const missingItems: string[] = []

  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  billObj.positions = caseOPItems
    .filter(current => current.isSammelArticle)
    .map(current => {
      const position = <ISammelPosition>{ date: new Date(), price: 0, priceTotal: 0 }

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

      return position
    })

  billObj.totalSum = 0
  billObj.totalOwed = 0

  billObj.missingData = missingData
  billObj.missingItems = missingItems
}
