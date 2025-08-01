import { MissingInfo } from '../../enums'
import {
  Case,
  CaseBookingSection,
  Contract,
  IBillObj,
  ICaseOPItem,
  ICasePosition,
  IVATAnagraphic,
  Steuerart,
} from '../../types'
import { computeNetPrice } from '../computeNetPrice'
import { checkMissingInfo, toDecimalsPlace } from '../generic-utilities'
import { checkPriceMissingInfo, getPrice } from '../utilities'

export const addExtrasToInvoice = (
  billObj: IBillObj,
  missingData: string[],
  missingItems: string[],
  booking: CaseBookingSection,
  contract: Contract,
  extraMaterials: ICaseOPItem[],
  caseObj: Case,
  excludeVat: Boolean = false,
  fullVatPercentage?: number,
  reducedVatPercentage?: number,
  vatAnagraphic?: IVATAnagraphic[],
) => {
  const bookingDate = checkMissingInfo(booking.date,
    MissingInfo.bookingSection.date,
    missingData,
    missingItems)

  const positions: ICasePosition[] = []

  let extrasTotal = 0

  billObj.extraMaterials?.forEach(current => {
    const currentPosition = <ICasePosition>{ date: bookingDate }
    const opItem = extraMaterials?.find(em => em.id === current.materialId) ?? null
    const vatItem = vatAnagraphic?.find(item => item.itemCode === current.materialId)

    checkPriceMissingInfo(contract, opItem, caseObj, missingData, missingItems)

    const amount = checkMissingInfo(
      current.amount,
      MissingInfo.materialsDatabase.extraMaterials.amount(current.materialId),
      missingData,
      missingItems,
      [0, NaN],
    )

    currentPosition.description =
      checkMissingInfo(
        opItem?.name,
        MissingInfo.materialsDatabase.extraMaterials.name(current.materialId),
        missingData,
        missingItems,
        [''],
      ) ?? ''

    let steuerart = null
    if (excludeVat)
      steuerart = checkMissingInfo(
        vatItem?.steuerart,
        MissingInfo.materialsDatabase.material.steuerart(current.materialId),
        missingData,
        missingItems,
        [''],
      )

    const editedPrice = current.editedPrice
    let originalPrice = null
    if (editedPrice == null)
      originalPrice = checkMissingInfo(
        getPrice(opItem),
        MissingInfo.materialsDatabase.extraMaterials.originalPrice(current.materialId),
        missingData,
        missingItems,
        [NaN],
      )

    const price = (editedPrice ?? originalPrice) ?? 0
    const parsedFullVat = fullVatPercentage ?? 0
    const parsedReducedVat = reducedVatPercentage ?? 0

    const netPrice = excludeVat
      ? computeNetPrice(price, steuerart as Steuerart, parsedFullVat, parsedReducedVat)
      : 0
    const positionPrice = excludeVat ? netPrice : price

    currentPosition.amount = toDecimalsPlace(amount, 3)
    currentPosition.price = toDecimalsPlace(positionPrice, 2)
    currentPosition.priceTotal = toDecimalsPlace(currentPosition.amount * currentPosition.price, 2)
    currentPosition.supplierNumber = opItem?.supplierNumber

    extrasTotal += currentPosition.priceTotal

    positions.push(currentPosition)
  })

  billObj.extraCustomCosts?.forEach(current => {
    const currentPosition = <ICasePosition>{ date: bookingDate }

    const price = checkMissingInfo(current.price,
      MissingInfo.extraCosts.price(current.name),
      missingData,
      missingItems,
      [NaN]) ?? 0

    currentPosition.description = current.name

    currentPosition.amount = 1
    currentPosition.price = toDecimalsPlace(price, 2)
    currentPosition.priceTotal = toDecimalsPlace(price, 2)

    extrasTotal += currentPosition.priceTotal

    positions.push(currentPosition)
  })

  billObj.positions = [...billObj.positions, ...positions]

  billObj.totalSum += extrasTotal
  billObj.totalOwed = billObj.totalSum
}
