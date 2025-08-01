import { addMonths, endOfDay, endOfMonth, endOfWeek, format, getUnixTime, isAfter, isSameDay, isSameWeek, isValid, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { getTimezoneOffset, utcToZonedTime } from 'date-fns-tz'
import { eScheduleNoteTimeSteps } from '../types'

export function getLockedWeekTimestamp (date: Date, timeZone: string) {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  const [year, month, day] = format(monday, 'yyyy-MM-dd').split('-')

  const utcDate = new Date(`${year}-${month}-${day}T00:00:00Z`)
  const utcTimestamp = getUnixTime(utcDate)
  const timeZoneOffset = getTimezoneOffset(timeZone, utcDate) / 1000

  return utcTimestamp - timeZoneOffset
}

export function getDayTimestamp (date: Date, timeZone: string) {
  const [year, month, day] = format(date, 'yyyy-MM-dd').split('-')

  const utcDate = new Date(`${year}-${month}-${day}T00:00:00Z`)
  const utcTimestamp = getUnixTime(utcDate)
  const timeZoneOffset = getTimezoneOffset(timeZone, utcDate) / 1000

  return utcTimestamp - timeZoneOffset
}

export function getMonthTimestamp (date: Date, timeZone: string) {
  const [year, month] = format(date, 'yyyy-MM').split('-')
  const utcDate = new Date(`${year}-${month}-01T00:00:00Z`)
  const utcTimestamp = getUnixTime(utcDate)
  const timeZoneOffset = getTimezoneOffset(timeZone, utcDate) / 1000

  return utcTimestamp - timeZoneOffset
}

export function getTimeStepTimestamp (
  date: Date, timeStep: eScheduleNoteTimeSteps, timeZone: string
) {
  switch (timeStep) {
    case eScheduleNoteTimeSteps.WEEKS:
      return getLockedWeekTimestamp(date, timeZone)
    case eScheduleNoteTimeSteps.MONTHS:
      return getMonthTimestamp(date, timeZone)
    case eScheduleNoteTimeSteps.DAYS:
      return getDayTimestamp(date, timeZone)
    default:
      throw new Error('Invalid time step')
  }
}

export function validateInsertedDate (date: number | Date | null): Date | null {
  if (date == null) return new Date('Invalid Date')
  let newDate = new Date(date)
  if (isValid(newDate) && isAfter(newDate!, new Date(999, 12, 31))) return newDate
  else return new Date('Invalid Date')
}

// From a timestamp, get the iso date with the timezone
export function getDateTimeName (
  timestamp: number, timeStep: eScheduleNoteTimeSteps, timeZone: string
) {
  let timeName = ''
  const zonedDate = utcToZonedTime(new Date(timestamp * 1000), timeZone)
  let startDate = null
  let endDate = null

  switch (timeStep) {
    case eScheduleNoteTimeSteps.WEEKS:
      startDate = startOfWeek(zonedDate, { weekStartsOn: 1 })
      endDate = endOfWeek(endOfDay(zonedDate), { weekStartsOn: 1 })
      timeName = `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM')}`
      break
    case eScheduleNoteTimeSteps.MONTHS:
      startDate = startOfMonth(zonedDate)
      endDate = endOfMonth(endOfDay(zonedDate))
      timeName = `${format(startDate, 'MMMM')}`
      break
    case eScheduleNoteTimeSteps.DAYS:
    default:
      startDate = zonedDate
      endDate = endOfDay(zonedDate)
      timeName = `${format(startDate, 'dd MMM')}`
      break
  }

  return timeName
}

export const getTimeStepProps = (date: Date, timeStep: eScheduleNoteTimeSteps) => {
  const today = startOfDay(new Date())
  let startDate = null
  let endDate = null
  let isToday = false
  let timeString = ''

  switch (timeStep) {
    case eScheduleNoteTimeSteps.WEEKS:
      startDate = startOfWeek(date, { weekStartsOn: 1 })
      endDate = endOfWeek(endOfDay(date), { weekStartsOn: 1 })
      isToday = isSameWeek(date, today, { weekStartsOn: 1 })
      timeString = `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM')}`
      break
    case eScheduleNoteTimeSteps.MONTHS:
      startDate = startOfMonth(date)
      endDate = endOfMonth(endOfDay(date))
      isToday = isSameDay(date, today)
      timeString = `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM')}`
      break
    case eScheduleNoteTimeSteps.DAYS:
    default:
      startDate = date
      endDate = endOfDay(date)
      isToday = isSameDay(date, today)
      timeString = `${format(startDate, 'dd MMM')}`
      break
  }

  return { today, startDate, endDate, isToday, timeString }
}

export const getBoundaries = (timestamp: number, timeZone: string) => {
  const zonedDate = utcToZonedTime(new Date(timestamp * 1000), timeZone)

  const startDay = getDayTimestamp(zonedDate, timeZone)
  const endDay = startDay + ((3600 * 24) - 1)
  const startWeek = getLockedWeekTimestamp(zonedDate, timeZone)
  const endWeek = startWeek + ((3600 * 24 * 7) - 1)
  const startMonth = getMonthTimestamp(zonedDate, timeZone)
  const endMonth = getMonthTimestamp(addMonths(zonedDate, 1), timeZone) - 1
  const secondMonth = getMonthTimestamp(addMonths(zonedDate, 1), timeZone)
  const endSecondMonth = getMonthTimestamp(addMonths(zonedDate, 2), timeZone) - 1
  const startFirstMonthWeek = getLockedWeekTimestamp(new Date(startMonth * 1000), timeZone)

  return {
    startDay,
    endDay,
    startWeek,
    endWeek,
    startMonth,
    endMonth,
    secondMonth,
    endSecondMonth,
    startFirstMonthWeek
  }
}

export const getZonedStartDay = (isoString: string, timeZone: string) => {
  const date = new Date(isoString)
  const zonedDate = utcToZonedTime(date, timeZone)
  const startOfDayInZone = startOfDay(zonedDate)

  return startOfDayInZone
}
