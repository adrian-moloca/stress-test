import { MissingInfo, RecipientType } from '../../enums'
import Translator from '../../translator'
import { Case, CaseBookingSection, Contract, IBillObj, ICaseOPItem, ICasePosition, IUser, Patient } from '../../types'
import { billPatientFromPatient, debtorFromSurgeon } from '../debtor-utilities'
import { checkMissingInfo } from '../generic-utilities'
import { checkPriceMissingInfo } from '../utilities'
import { addExtrasToInvoice } from './extras-invoice'

export const computeSachkostenInvoiceBill = (
  translator: Translator,
  billObj: IBillObj,
  surgeon: IUser,
  patient: Patient,
  booking: CaseBookingSection,
  caseOPItems: ICaseOPItem[],
  contract: Contract,
  extraMaterials: ICaseOPItem[],
  caseObj: Case,
) => {
  const missingData: string[] = []
  const missingItems: string[] = []

  const bookingDate = checkMissingInfo(booking.date,
    MissingInfo.bookingSection.date,
    missingData,
    missingItems)

  const positions: ICasePosition[] = []
  // invoiceDate: the invoice generation date
  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  let billTotal = 0
  caseOPItems
    .filter(current => current.isSachkostenArticle)
    .forEach(current => {
      // Then we have materials positions, calculated from each of case.documentation.items as follows:
      const currentPosition = <ICasePosition>{ date: bookingDate }
      const amount = current.amount ?? 0

      checkPriceMissingInfo(contract, current, caseObj, missingData, missingItems)
      const price = current.price ?? 0

      checkMissingInfo(
        !(current.isSachkostenArticle && current.isSammelArticle),
        MissingInfo.materialsDatabase.sammelSachkostenConflict(current.id),
        missingData,
        missingItems,
        [false],
      )

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
      currentPosition.price = price
      currentPosition.priceTotal = price * amount
      currentPosition.supplierNumber = current.supplierNumber

      billTotal += currentPosition.priceTotal
      currentPosition.materialId = current.id
      positions.push(currentPosition)
    })

  billObj.positions = positions

  billObj.totalSum = billTotal
  billObj.totalOwed = billTotal

  billObj.missingData = missingData
  billObj.missingItems = missingItems

  addExtrasToInvoice(billObj, missingData, missingItems, booking, contract, extraMaterials, caseObj)
}
