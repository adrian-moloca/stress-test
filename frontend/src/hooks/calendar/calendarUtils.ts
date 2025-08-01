import {
  IContractState,
  ILimitedCase,
  calendarEndHour,
  calendarStartHour,
  getCaseContract,
} from '@smambu/lib.constants'
import { parse, add, getDay, sub, isBefore, startOfDay, isAfter, endOfDay } from 'date-fns'

export const getArrayfromDateRange = ({ startDate, endDate }:
{ startDate: Date; endDate: Date }) => {
  let dateArray = []
  let currentDate = new Date(startDate)
  let firstMonday = new Date(currentDate)
  while (getDay(firstMonday) !== 1) firstMonday = sub(firstMonday, { days: 1 })

  while (isBefore(startOfDay(firstMonday), startOfDay(startDate))) {
    dateArray.push(null)
    firstMonday = add(firstMonday, { days: 1 })
  }

  while (!isAfter(startOfDay(currentDate), startOfDay(endDate))) {
    dateArray.push(currentDate)
    currentDate = add(currentDate, { days: 1 })
  }
  // fill up to last sunday
  while (getDay(currentDate) !== 1) {
    dateArray.push(null)
    currentDate = add(currentDate, { days: 1 })
  }

  return dateArray
}

export const getFiveMinutesSlotsArray = ({
  date,
  expandedAfter,
  expandedBefore,
}: {
  date: Date
  expandedAfter: boolean
  expandedBefore: boolean
}) => {
  const slots = []
  let start = expandedBefore ? startOfDay(date) : parse(calendarStartHour, 'HH:mm', date)
  const end = expandedAfter ? endOfDay(date) : parse(calendarEndHour, 'HH:mm', date)
  while (start <= end) {
    slots.push(new Date(start))
    start = add(start, { minutes: 5 })
  }
  return slots
}

const getCaseEndHour = (caseForm: ILimitedCase, contracts: IContractState) => {
  const contract = getCaseContract({
    caseForm,
    contracts,
  })

  const caseStartDate = caseForm.bookingSection.date

  const caseCustomDuration = caseForm.bookingSection.duration
  const opstandardDuration = contract?.opStandards?.[caseForm.bookingSection.opStandardId]
    ?.surgeryDurationInMinutes

  const minutes = caseCustomDuration != null ? caseCustomDuration : opstandardDuration

  const endHour = add(caseStartDate, { minutes })

  return endHour
}

export const getCaseOffset = (cases: ILimitedCase[], index: number, contracts: IContractState) => {
  if (index === 0) return 0

  let i = index
  let offset = 0

  while (i > 0) {
    const previousCase = cases[i - 1]
    const previousCaseEndingHour = getCaseEndHour(previousCase, contracts)

    const currentCaseStartDate = cases[index].bookingSection.date

    if (isAfter(previousCaseEndingHour, currentCaseStartDate)) offset++

    i--
  }

  return offset
}
