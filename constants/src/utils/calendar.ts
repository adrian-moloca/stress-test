import { calendarMinimumIntervalsHeight, calendarMinutesInterval, calendarTimeHeightPx } from '../constants'

export const calcCardHeight = (duration?: number) => {
  if (duration == null) return 0

  const realHeight = calendarTimeHeightPx * (duration / calendarMinutesInterval)
  const minimumHeight = calendarTimeHeightPx * calendarMinimumIntervalsHeight
  const height = realHeight > minimumHeight ? realHeight : minimumHeight

  return height
}

export const calcCardDuration = (height: number) => {
  return Math.round(height / calendarTimeHeightPx) * calendarMinutesInterval
}
