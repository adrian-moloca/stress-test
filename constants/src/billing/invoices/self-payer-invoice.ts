import { MissingInfo, RecipientType } from '../../enums'
import Translator from '../../translator'
import {
  Case,
  CaseBookingSection,
  Contract,
  IBillObj,
  ICaseOPItem,
  ICasePosition,
  IUser,
  Patient,
  ThirdPartyBillingContact,
  Timestamps,
} from '../../types'
import { billPatientFromPatient, debtorFromPatient, debtorFromSurgeon, debtorFromThirdParty } from '../debtor-utilities'
import { checkMissingInfo, minutesBetween, toDecimalsPlace } from '../generic-utilities'
import { checkPriceMissingInfo } from '../utilities'
import { addExtrasToInvoice } from './extras-invoice'

export const computeSelfPayerInvoiceBill = (
  translator: Translator,
  billObj: IBillObj,
  patient: Patient,
  contract: Contract,
  booking: CaseBookingSection,
  recipientType: RecipientType,
  timeStamps: Timestamps,
  thirdParty: ThirdPartyBillingContact | null,
  caseOPItems: ICaseOPItem[],
  extraMaterials: ICaseOPItem[],
  caseObj: Case,
  surgeon: IUser,
  anesthesiaOPItems: ICaseOPItem[],
) => {
  const missingData: string[] = []
  const missingItems: string[] = []

  const bookingDate = checkMissingInfo(booking.date,
    MissingInfo.bookingSection.date,
    missingData,
    missingItems)

  const recipient = checkMissingInfo(
    recipientType,
    MissingInfo.bookingSection.billingContact,
    missingData,
    missingItems,
  )

  switch (recipient) {
    case RecipientType.PATIENT:
      billObj.debtor = debtorFromPatient(patient, missingData, missingItems)
      billObj.recipient = RecipientType.PATIENT
      break

    case RecipientType.THIRD_PARTY:
      billObj.debtor = debtorFromThirdParty(thirdParty, missingData, missingItems)
      billObj.recipient = RecipientType.THIRD_PARTY
      break

    case RecipientType.DOCTOR:
      billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
      billObj.recipient = RecipientType.DOCTOR
      break
  }

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  const generalFeePosition = <ICasePosition>{}

  let billTotal = 0
  const positions: ICasePosition[] = []

  const items = [...caseOPItems, ...anesthesiaOPItems]
  items.forEach(current => {
    const currentPosition = <ICasePosition>{ date: bookingDate }

    const amount = current.amount ?? 0

    checkPriceMissingInfo(contract, current, caseObj, missingData, missingItems)
    const price = current.price ?? 0

    const positionDefaultLabel = `${current.id} - ${translator.fromLabel('opStandardTable_missing_material')}`
    currentPosition.description =
      checkMissingInfo(
        current.name,
        MissingInfo.materialsDatabase.material.name(current.id),
        missingData,
        missingItems,
        [''],
      ) ?? positionDefaultLabel
    currentPosition.amount = toDecimalsPlace(amount, 3)
    currentPosition.price = toDecimalsPlace(price, 2)
    currentPosition.priceTotal = toDecimalsPlace(currentPosition.amount * currentPosition.price, 2)
    billTotal += currentPosition.priceTotal
    currentPosition.materialId = current.id
    positions.push(currentPosition)
  })

  // definitions:
  // durationMinutes: case.intraOp.timeEndOfSurgicalMeasures - case.intraOp.timeReleasedForSurgery
  // new update, 17/10/2023: the timestamps needed are room enter and room exit time, plus 20 minutes
  const roomEnterTS = checkMissingInfo(
    timeStamps.roomEnterTimestamp,
    MissingInfo.timestamps.roomEnterTimestamp,
    missingData,
    missingItems,
  )
  const roomExitTS = checkMissingInfo(
    timeStamps.roomExitTimestmap,
    MissingInfo.timestamps.roomExitTimestmap,
    missingData,
    missingItems,
  )

  const rawMinutes = minutesBetween(roomEnterTS, roomExitTS, true)
  const durationMinutes = rawMinutes == null || isNaN(rawMinutes) ? 20 : rawMinutes + 20

  // excessMinutes: durationMinutes - 60 (or 0 if durationMinutes < 60)
  const excessMinutes = Math.max(durationMinutes - 60, 0)
  // excessHalfHours: excessMinutes / 30 rounded by ceiling
  const excessHalfHours = Math.ceil(excessMinutes / 30)

  const feeFirstHour =
    checkMissingInfo(
      (contract as any).billingC3?.firstHourFee,
      MissingInfo.contract.billingC3.firstHourFee,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0
  const feeHalfHour =
    checkMissingInfo(
      (contract as any).billingC3?.halfHourFee,
      MissingInfo.contract.billingC3.halfHourFee,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0

  const totalFee = feeFirstHour + (feeHalfHour * excessHalfHours)

  const excessHalfText = excessHalfHours
    ? translator.fromLabel('excess_half_hour', { excessHalfHours: `${excessHalfHours}` })
    : ''

  generalFeePosition.date = bookingDate
  generalFeePosition.description = translator.fromLabel('self_payer_usage_fee', { excessHalfText })
  generalFeePosition.price = toDecimalsPlace(totalFee, 2)
  generalFeePosition.amount = 1
  generalFeePosition.priceTotal = toDecimalsPlace(totalFee, 2)

  billTotal += generalFeePosition.priceTotal

  positions.push(generalFeePosition)

  billObj.positions = positions

  billObj.totalSum = billTotal
  billObj.totalOwed = billTotal

  billObj.missingData = missingData
  billObj.missingItems = missingItems

  addExtrasToInvoice(billObj, missingData, missingItems, booking, contract, extraMaterials, caseObj)
}
