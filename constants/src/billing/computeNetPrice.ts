import { Steuerart } from '../types'

export const computeNetPrice = (
  price: number,
  steuerart: Steuerart,
  fullVatPercentage: number,
  reducedVatPercentage: number,
) => {
  let netPrice: number
  switch (steuerart) {
    case Steuerart.VOLLER_SATZ:
      netPrice = (price / (100 + fullVatPercentage)) * 100
      break
    case Steuerart.ERMÄßIGTER_SATZ:
      netPrice = (price / (100 + reducedVatPercentage)) * 100
      break
    default:
      netPrice = 0
  }
  return netPrice
}
