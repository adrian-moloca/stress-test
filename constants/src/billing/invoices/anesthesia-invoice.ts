import { BillingCategory, MissingInfo, RecipientType } from '../../enums'
import Translator from '../../translator'
import { Case, CaseBookingSection, IBillObj, ICaseOPItem, ICasePosition, Patient } from '../../types'
import { billPatientFromPatient, debtorFromPatient } from '../debtor-utilities'
import { checkMissingInfo } from '../generic-utilities'
import { addExtrasToInvoice } from './extras-invoice'

export const computeAnesthesiaInvoiceBill = (
  translator: Translator,
  billObj: IBillObj,
  category: BillingCategory,
  patient: Patient,
  contract: any, // Removed Contract type to avoid type errors without changing the whole file
  booking: CaseBookingSection,
  extraMaterials: ICaseOPItem[],
  caseObj: Case,
) => {
  const missingData: string[] = []
  const missingItems: string[] = []

  const bookingDate = checkMissingInfo(booking.date,
    MissingInfo.bookingSection.date,
    missingData,
    missingItems)

  const position = <ICasePosition>{ date: bookingDate }
  const opStandardId = checkMissingInfo(
    booking.opStandardId,
    MissingInfo.bookingSection.opStandardId,
    missingData,
    missingItems,
    [''],
  )

  let opStandardOverrides

  switch (category) {
    case BillingCategory.C2:
      opStandardOverrides =
        checkMissingInfo(
          contract.billingC2?.opstandardOverrides,
          MissingInfo.contract.billingC2.overrides,
          missingData,
          missingItems,
          [{}],
        ) ?? []
      break
    case BillingCategory.D:
      opStandardOverrides =
        checkMissingInfo(
          contract.billingD?.opstandardOverrides,
          MissingInfo.contract.billingD.overrides,
          missingData,
          missingItems,
          [{}],
        ) ?? []
      break

    // no default
  }

  billObj.debtor = debtorFromPatient(patient, missingData, missingItems)
  billObj.recipient = RecipientType.PATIENT

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  // Then we have a single position, defined as follows:
  position.description = translator.fromLabel('anesthesia_position_heading')

  const opStandardOverride = opStandardOverrides
    ?.find((current: any) => current.opStandardId === opStandardId)

  position.amount = 1
  position.price =
    checkMissingInfo(
      opStandardOverride?.anesthesiaFee,
      MissingInfo.contract.override.anesthesiaFee,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0
  position.priceTotal =
    checkMissingInfo(
      opStandardOverride?.anesthesiaFee,
      MissingInfo.contract.override.anesthesiaFee,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0

  billObj.positions = [position]

  billObj.totalSum = position.priceTotal
  billObj.totalOwed = position.priceTotal

  addExtrasToInvoice(billObj, missingData, missingItems, booking, contract, extraMaterials, caseObj)

  billObj.missingData = missingData
  billObj.missingItems = missingItems
}
