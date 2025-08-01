import { v4 } from 'uuid'
import { ISystemConfigurationVatValueRow, MaterialPriceOverride } from '../types'

export const newVatValuesRow = (): ISystemConfigurationVatValueRow => ({
  id: v4(),
  fullPercentage: 0,
  halfPercentage: 0,
  validFrom: new Date(),
})

export const newMaterialPriceOverride = (): MaterialPriceOverride => ({
  id: `tempId_${v4()}`,
  price: 0,
})
