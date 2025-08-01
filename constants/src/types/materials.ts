import { IAnagraphicRow } from './anagraphics'
import { IUser } from './users'

export type MaterialUsageItem = ({
  doctor: IUser
  amount_used: number
  total: number
  surplus: number
  billableUnits: number
  remainingAmount: number
}& IAnagraphicRow)
