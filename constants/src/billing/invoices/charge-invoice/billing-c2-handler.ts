import { MissingInfo, RecipientType } from '../../../enums'
import Translator from '../../../translator'
import { IBillObj, ICasePosition, IUser, Patient } from '../../../types'
import { billPatientFromPatient, debtorFromSurgeon } from '../../debtor-utilities'
import { checkMissingInfo } from '../../generic-utilities'

export const billingC2Handler = (
  translator: Translator,
  billObj: IBillObj,
  missingData: string[],
  missingItems: string[],
  surgeon: IUser,
  patient: Patient,
  position: ICasePosition,
  contract: any, // Removed Contract type to avoid type errors without changing the whole file
  opStandardId: string,
) => {
  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  position.description = translator.fromLabel('fee_label')
  position.amount = 1

  const billingC2Override =
    checkMissingInfo(
      contract.billingC2?.opstandardOverrides,
      MissingInfo.contract.billingC2.overrides,
      missingData,
      missingItems,
    ) ?? []

  const opStandardOverride = checkMissingInfo(
    billingC2Override.find((current: any) => current.opStandardId === opStandardId),
    MissingInfo.contract.billingC2.opstandardOverride(opStandardId),
    missingData,
    missingItems,
  )

  position.price =
    checkMissingInfo(opStandardOverride?.charge,
      MissingInfo.contract.override.charge,
      missingData,
      missingItems,
      [
        NaN,
      ]) ?? 0
  position.priceTotal = opStandardOverride?.charge ?? 0

  billObj.positions = [position]

  billObj.totalSum = position.priceTotal
  billObj.totalOwed = position.priceTotal
}
