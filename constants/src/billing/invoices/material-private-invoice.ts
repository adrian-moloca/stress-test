import { BillingCategory, MissingInfo, RecipientType } from '../../enums'
import {
  Case,
  CaseBookingSection,
  Contract,
  IBillObj,
  ICaseOPItem,
  ICasePosition,
  IParsedBG,
  Patient,
} from '../../types'
import { billPatientFromPatient, debtorFromBG, debtorFromPatient } from '../debtor-utilities'
import { checkMissingInfo, toDecimalsPlace } from '../generic-utilities'
import { addExtrasToInvoice } from './extras-invoice'
import { isValidNumber } from '../../utils'
import { checkPriceMissingInfo } from '../utilities'
import Translator from '../../translator'

export const computeMaterialPrivateBill = (
  translator: Translator,
  billObj: IBillObj,
  category: BillingCategory,
  caseOPItems: ICaseOPItem[],
  patient: Patient,
  booking: CaseBookingSection,
  contract: Contract,
  extraMaterials: ICaseOPItem[],
  caseObj: Case,
  bg?: IParsedBG,
) => {
  const missingData: string[] = []
  const missingItems: string[] = []

  const bookingDate = checkMissingInfo(booking.date,
    MissingInfo.bookingSection.date,
    missingData,
    missingItems)

  const positions: ICasePosition[] = []

  let billTotal = 0

  switch (category) {
    case BillingCategory.A:
      billObj.debtor = debtorFromBG(bg, missingData, missingItems)
      billObj.recipient = RecipientType.THIRD_PARTY
      break

    case BillingCategory.B:
      billObj.debtor = debtorFromPatient(patient, missingData, missingItems)
      billObj.recipient = RecipientType.PATIENT
      break

    default:
      const errorLabel = translator.fromLabel('material_private_missing_debtor_error', { category })

      throw new Error(errorLabel)
  }

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  // Then we have positions, calculated from each of case.documentation.items as follows:
  // preop, intraop, postop

  caseOPItems.forEach(current => {
    const currentPosition = <ICasePosition>{ date: bookingDate }
    const amount = current.amount ?? 0

    checkPriceMissingInfo(contract, current, caseObj, missingData, missingItems)
    const price = current.price ?? 0
    // position.date: case.surgeryDate
    const defaultPositionLabel = `${current.id} - ${translator.fromLabel('opStandardTable_missing_material')}`
    currentPosition.description =
      checkMissingInfo(
        current.name,
        MissingInfo.materialsDatabase.material.name(current.id),
        missingData,
        missingItems,
        [''],
      ) ?? defaultPositionLabel
    currentPosition.amount = toDecimalsPlace(amount, 3)
    currentPosition.price = toDecimalsPlace(price, 2)
    currentPosition.priceTotal = toDecimalsPlace(currentPosition.amount * currentPosition.price, 2)
    currentPosition.supplierNumber = current.supplierNumber

    billTotal += currentPosition.priceTotal
    currentPosition.materialId = current.id
    positions.push(currentPosition)
  })

  billObj.positions = positions

  billObj.totalSum = billTotal
  billObj.totalOwed = isValidNumber(billTotal) ? billTotal : 0

  billObj.missingData = missingData
  billObj.missingItems = missingItems

  addExtrasToInvoice(billObj, missingData, missingItems, booking, contract, extraMaterials, caseObj)
}
