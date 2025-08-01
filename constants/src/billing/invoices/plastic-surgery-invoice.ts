import { MissingInfo, RecipientType } from '../../enums'
import {
  Case,
  CaseAnesthesiaSection,
  CaseBookingSection,
  Contract,
  IBillObj,
  ICaseOPItem,
  ICasePosition,
  IUser,
  Patient,
  Timestamps,
} from '../../types'
import { billPatientFromPatient, debtorFromSurgeon } from '../debtor-utilities'
import { checkMissingInfo, toDecimalsPlace } from '../generic-utilities'
import { addExtrasToInvoice } from './extras-invoice'
import { checkPriceMissingInfo } from '../utilities'
import { computeAnesthesiaFeePosition } from '../computeAnesthesiaFeePosition'
import Translator from '../../translator'

export const computePlasticSurgeryInvoiceBill = (
  translator: Translator,
  billObj: IBillObj,
  surgeon: IUser,
  patient: Patient,
  contract: Contract,
  booking: CaseBookingSection,
  caseOPItems: ICaseOPItem[],
  timeStamps: Timestamps,
  anesthesiaSection: CaseAnesthesiaSection,
  extraMaterials: ICaseOPItem[],
  caseObj: Case,
  anesthesiaOPItems: ICaseOPItem[],
) => {
  const missingData: string[] = []
  const missingItems: string[] = []

  const bookingDate = checkMissingInfo(booking.date,
    MissingInfo.bookingSection.date,
    missingData,
    missingItems)

  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  const positions: ICasePosition[] = []

  let billTotal = 0

  const items = [...caseOPItems, ...anesthesiaOPItems]
  items.forEach(current => {
    // definitions:
    // (SKIPPED) overwriteItem: retrieved from surgeon.contract.catG.materialPrices, searching the current item
    // (SKIPPED) NOTE: if no overwriteItem is found, the current item is NOT skipped (correction due to an email by Johannes on 4th july, item #10)

    // TODO non mi piace affidarmi alla cieca al prezzo che viene da fuori, preferirei che fosse invocata qui la getPrice, anche perché se no non so da dove venga il missing price
    const amount = current.amount ?? 0

    checkPriceMissingInfo(contract, current, caseObj, missingData, missingItems)
    const price = current.price ?? 0

    const currentPosition = <ICasePosition>{ date: bookingDate }
    const positionDefaultLabel = `${current.id} - ${translator.fromLabel('opStandardTable_missing_material')}`
    currentPosition.description =
      checkMissingInfo(
        current.name,
        MissingInfo.materialsDatabase.material.name(current.id),
        missingData,
        missingItems,
        [''],
      ) ?? positionDefaultLabel
    currentPosition.amount = amount
    currentPosition.price = toDecimalsPlace(price, 2)
    currentPosition.priceTotal = toDecimalsPlace(currentPosition.amount * currentPosition.price, 2)

    billTotal += currentPosition.priceTotal
    currentPosition.materialId = current.id
    positions.push(currentPosition)
  })

  const singleFeePosition = computeAnesthesiaFeePosition(
    translator,
    bookingDate,
    timeStamps,
    anesthesiaSection,
    (contract as any).billingC1,
    missingData,
    missingItems,
  )

  billTotal += singleFeePosition.priceTotal

  positions.push(singleFeePosition)

  billObj.positions = positions

  billObj.totalSum = billTotal
  billObj.totalOwed = billTotal

  billObj.missingData = missingData
  billObj.missingItems = missingItems

  addExtrasToInvoice(billObj, missingData, missingItems, booking, contract, extraMaterials, caseObj)
}
