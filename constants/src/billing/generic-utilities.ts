import { CustomBg, IDebtor, ISammelCheckpoint } from '../types'
import { isValidNumber } from '../utils'

export const addDays = (current: Date, days: number): Date => {
  const updated = new Date(current)

  updated.setDate(updated.getDate() + days)

  return updated
}

export const minutesBetween = (from: Date | string, to: Date | string, ceil: boolean = false) => {
  if (from == null || from === '' || to == null || to === '') return null

  // dates from backend are sometimes string timestamps, sometimes actual dates
  // with this snippet we ensure that it is actually a date
  const _from = new Date(from)
  const _to = new Date(to)

  const differenceValue = (_to.getTime() - _from.getTime()) / 1000 / 60

  const roundFunc = ceil ? Math.ceil : Math.round
  return Math.abs(roundFunc(differenceValue))
}

export const toDecimalsPlace = (amount: number, places: number): number => {
  if (isNaN(amount)) return 0
  return Number((Math.round(amount * 100) / 100).toFixed(places))
}

export const isCustomBgSelected = (BG: CustomBg | null) => BG?.company ||
 BG?.name ||
 BG?.surname ||
 BG?.street

export const checkMissingInfo = <T>(
  value: T,
  identifier: string,
  missingData: string[],
  missingItems: string[],
  additionalValues?: unknown[],
) => {
  const valueOk = value != null && !additionalValues?.includes(value)

  if (!valueOk && !missingItems.includes(identifier)) {
    const rootInfo = identifier.split('.')[0]

    if (!missingData.includes(rootInfo)) missingData.push(rootInfo)

    missingItems.push(identifier)
  }

  return value
}

export const formatDebtorName = (debtor: IDebtor) => {
  if (!debtor) return ''

  const { title, firstName, lastName } = debtor

  const debtorData = [title, firstName, lastName]

  return debtorData.filter(el => el).join(' ')
}

export const formatCurrency = (price: number,
  currencySymbol: string,
  locale: string,
  isRefund: boolean = false) => {
  if (!isValidNumber(price)) return ''
  const normalized = isRefund ? price * -1 : price

  const localizedFormattedNumber = normalized.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `${localizedFormattedNumber} ${currencySymbol}`
}

export const needsSammelInvoice = (newCheckpoint: ISammelCheckpoint) => {
  const firstNew = newCheckpoint.consumptions.findIndex(current => current.usedAmount > 0)

  return firstNew !== -1
}

export const generatePDFArchivesFilename = () => {
  const now = new Date()
  const timePart = now.getTime()
  const randomPart = Math.random()
    .toString(36)
    .substring(2)

  return `invoices_${timePart}_${randomPart}.zip`
}
