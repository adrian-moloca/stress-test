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
  IVATAnagraphic,
  Patient,
  Steuerart,
  Timestamps,
} from '../../types'
import { billPatientFromPatient, debtorFromSurgeon } from '../debtor-utilities'
import { checkMissingInfo, toDecimalsPlace } from '../generic-utilities'
import { addExtrasToInvoice } from './extras-invoice'
import { computeNetPrice } from '../computeNetPrice'
import { checkPriceMissingInfo } from '../utilities'
import { computeAnesthesiaFeePosition } from '../computeAnesthesiaFeePosition'
import Translator from '../../translator'

export const computePlasticSurgeryWithVatInvoiceBill = (
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
  vatAnagraphic?: IVATAnagraphic[],
) => {
  const currentLocale = translator.getLanguageString()

  if (currentLocale === null) throw new Error('undefined locale')

  const missingData: string[] = []
  const missingItems: string[] = []

  const bookingDate = checkMissingInfo(booking.date,
    MissingInfo.bookingSection.date,
    missingData,
    missingItems)

  // we take the fist item in the anagraphic, since the vat is the same for every item
  // (it is taken from the date-appropriate system config)
  const firstItem = vatAnagraphic?.[0]

  let fullVatPercentage = 0
  let reducedVatPercentage = 0

  if (firstItem) {
    fullVatPercentage =
      checkMissingInfo(
        typeof firstItem?.fullVatPercentage === 'string'
        // TODO: find out why this field could be string, fix it and remove this parser
          ? parseFloat(firstItem?.fullVatPercentage)
          : firstItem?.fullVatPercentage,
        MissingInfo.systemConfig.vatAnagraphic.fullVatPercentage,
        missingData,
        missingItems,
        [0, NaN],
      ) ?? 0

    reducedVatPercentage =
      checkMissingInfo(
        typeof firstItem?.reducedVatPercentage === 'string'
        // TODO: find out why this field could be string, fix it and remove this parser
          ? parseFloat(firstItem?.reducedVatPercentage)
          : firstItem?.reducedVatPercentage,
        MissingInfo.systemConfig.vatAnagraphic.reducedVatPercentage,
        missingData,
        missingItems,
        [0, NaN],
      ) ?? 0
  }

  let billTotal = 0

  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  const positions: ICasePosition[] = []

  const items = [...caseOPItems, ...anesthesiaOPItems]
  //   Then we have materials positions, calculated from each of case.documentation.items as follows:
  items.forEach(current => {
    // definitions:
    const vatItem = vatAnagraphic?.find(item => item.itemCode === current.id)

    // vatItem: retrieved from the ArticleVATType anagraphics searching the item.code in the Artikelnummer column
    // netPrice: calculated depending on vatItem.steuerart, using
    // if vatItem.steuerart = VOLLER SATZ: item.price / (100% + systemConfiguration.fullVatPercentage) * 100
    // if vatItem.steuerart = ERMÄßIGTER SATZ: item.price / (100% + systemConfiguration.reducedVatPercentage) * 100

    // TODO non mi piace affidarmi alla cieca al prezzo che viene da fuori, preferirei che fosse invocata qui la getPrice, anche perché se no non so da dove venga il missing price
    checkPriceMissingInfo(contract, current, caseObj, missingData, missingItems)
    const price = current.price ?? 0

    const steuerart = checkMissingInfo(
      vatItem?.steuerart,
      MissingInfo.materialsDatabase.material.steuerart(current.id),
      missingData,
      missingItems,
      [''],
    )

    let netPrice = computeNetPrice(price,
      steuerart as Steuerart,
      fullVatPercentage,
      reducedVatPercentage)

    // (SKIPPED) overwriteItem: retrieved from surgeon.contract.catG.materialPrices, searching the current item
    // (SKIPPED) NOTE: if no overwriteItem is found, the current item is NOT skipped (correction due to an email by Johannes on 4th july, item #10)

    const amount = current.amount ?? 0
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
    currentPosition.amount = toDecimalsPlace(amount, 3)
    currentPosition.price = toDecimalsPlace(netPrice, 2)
    currentPosition.priceTotal = toDecimalsPlace(currentPosition.price * currentPosition.amount, 2)

    billTotal += currentPosition.priceTotal
    currentPosition.materialId = current.id
    positions.push(currentPosition)
  })

  const feePosition = computeAnesthesiaFeePosition(
    translator,
    bookingDate,
    timeStamps,
    anesthesiaSection,
    (contract as any).billingG,
    missingData,
    missingItems,
  )

  billTotal += feePosition.priceTotal
  positions.push(feePosition)

  billObj.totalSum = billTotal
  billObj.positions = positions

  addExtrasToInvoice(
    billObj,
    missingData,
    missingItems,
    booking,
    contract,
    extraMaterials,
    caseObj,
    true,
    fullVatPercentage,
    reducedVatPercentage,
    vatAnagraphic,
  )

  // Finally, we have an additional position which adds back the VAT, defined as follows:
  const vatPosition = <ICasePosition>{ date: bookingDate, vatPosition: true }
  // definitions
  // netTotal: sum of the priceTotal of all previous positions (from materials and fees)
  const netTotal = billObj.positions.reduce((acc, curr) => acc + curr.priceTotal, 0)
  const vat = (netTotal * fullVatPercentage) / 100

  const roundedVat = toDecimalsPlace(vat, 2)

  billObj.totalSum += roundedVat

  vatPosition.description = translator.fromLabel('vat_invoice_label', {
    vat: `${roundedVat.toLocaleString(currentLocale)}`,
    fullVatPercentage: `${toDecimalsPlace(fullVatPercentage, 2).toLocaleString(currentLocale)}`,
    netTotal: `${toDecimalsPlace(netTotal, 2).toLocaleString(currentLocale)}`,
  })
  vatPosition.price = toDecimalsPlace(vat, 2)

  vatPosition.priceTotal = toDecimalsPlace(vat, 2)
  vatPosition.amount = 1
  billObj.positions.push(vatPosition)

  billObj.totalOwed = billObj.totalSum

  billObj.missingData = missingData
  billObj.missingItems = missingItems
}
