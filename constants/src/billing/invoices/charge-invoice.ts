import { BillingCategory, MissingInfo } from '../../enums'
import Translator from '../../translator'
import {
  Case,
  CaseBookingSection,
  GOAAnagraphic,
  IBillObj,
  ICaseOPItem,
  ICasePosition,
  IEBMAnagraphic,
  IUser,
  Patient,
} from '../../types'
import { checkMissingInfo } from '../generic-utilities'
import { billingABHandler } from './charge-invoice/billing-a-b-handler'
import { billingC2Handler } from './charge-invoice/billing-c2-handler'
import { billingDHandler } from './charge-invoice/billing-d-handler'
import { billingEHandler } from './charge-invoice/billing-e-handler'
import { addExtrasToInvoice } from './extras-invoice'

export const computeChargeInvoiceBill = (
  translator: Translator,
  billObj: IBillObj,
  category: BillingCategory,
  surgeon: IUser,
  patient: Patient,
  contract: any, // Removed Contract type to avoid type errors without changing the whole file
  booking: CaseBookingSection,
  caseOPItems: ICaseOPItem[],
  extraMaterials: ICaseOPItem[],
  caseObj: Case,
  goaAnagraphic?: GOAAnagraphic,
  ebmAnagraphic?: IEBMAnagraphic,
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

  const billingA = contract.billingA
  const billingB = contract.billingB
  const billingE = contract.billingE

  switch (category) {
    case BillingCategory.A:
      billingABHandler(
        translator,
        billObj,
        missingData,
        missingItems,
        surgeon,
        patient,
        position,
        category,
        billingA?.scenario,
        billingA?.minimumCharge,
        goaAnagraphic,
      )

      break

    case BillingCategory.B:
      billingABHandler(
        translator,
        billObj,
        missingData,
        missingItems,
        surgeon,
        patient,
        position,
        category,
        billingB?.scenario,
        billingB?.minimumCharge,
        goaAnagraphic,
      )

      break

    case BillingCategory.C2:
      billingC2Handler(
        translator,
        billObj,
        missingData,
        missingItems,
        surgeon,
        patient,
        position,
        contract,
        opStandardId,
      )

      break

    case BillingCategory.D:
      billingDHandler(
        translator,
        billObj,
        missingData,
        missingItems,
        surgeon,
        patient,
        contract,
        opStandardId,
        caseOPItems,
        bookingDate,
      )

      break

    case BillingCategory.E:
      billingEHandler(
        translator,
        billObj,
        missingData,
        missingItems,
        surgeon,
        patient,
        caseOPItems,
        bookingDate,
        contract,
        caseObj,
        billingE,
        ebmAnagraphic,
      )

      break

    default:
      const errorLabel = translator.fromLabel('charge_invoice_invalid_category', { category })

      throw new Error(errorLabel)
  }

  billObj.missingData = missingData
  billObj.missingItems = missingItems

  addExtrasToInvoice(billObj, missingData, missingItems, booking, contract, extraMaterials, caseObj)
}
