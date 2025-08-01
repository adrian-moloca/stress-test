import { MissingInfo, RecipientType, RoomType } from '../../enums'
import Translator from '../../translator'
import { Case, CaseBookingSection, Contract, IBillObj, ICaseOPItem, ICasePosition, Patient } from '../../types'
import { billPatientFromPatient, debtorFromPatient } from '../debtor-utilities'
import { checkMissingInfo } from '../generic-utilities'
import { addExtrasToInvoice } from './extras-invoice'

export const computeOvernightStayInvoice = (
  translator: Translator,
  billObj: IBillObj,
  patient: Patient,
  contract: Contract,
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

  billObj.debtor = debtorFromPatient(patient, missingData, missingItems)
  billObj.recipient = RecipientType.PATIENT

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  const position = <ICasePosition>{ date: bookingDate }

  const details = contract.details

  let overnightFee = 0
  switch (booking.roomType) {
    case RoomType.ONE_BED:
      overnightFee =
        checkMissingInfo(
          details.overnightStayFee1Bed,
          MissingInfo.contract.overnightStayFee1Bed,
          missingData,
          missingItems,
          [NaN],
        ) ?? 0
      break
    case RoomType.TWO_BEDS:
      overnightFee =
        checkMissingInfo(
          details.overnightStayFee2Bed,
          MissingInfo.contract.overnightStayFee2Bed,
          missingData,
          missingItems,
          [NaN],
        ) ?? 0
      break
    case RoomType.THREE_BEDS:
      overnightFee =
        checkMissingInfo(
          details.overnightStayFee3Bed,
          MissingInfo.contract.overnightStayFee3Bed,
          missingData,
          missingItems,
          [NaN],
        ) ?? 0
      break

    default:
      const errorLabel = translator.fromLabel('wrong_room_type', { roomType: booking.roomType ?? 'null' })

      throw new Error(errorLabel)
  }

  position.description = translator.fromLabel('overnight_stay_label')
  position.amount = 1
  position.price = overnightFee
  position.priceTotal = overnightFee

  billObj.positions = [position]

  billObj.totalSum = overnightFee
  billObj.totalOwed = overnightFee

  billObj.missingData = missingData
  billObj.missingItems = missingItems

  addExtrasToInvoice(billObj, missingData, missingItems, booking, contract, extraMaterials, caseObj)
}
