export function getTodayDate () {
  const today = new Date(Date.now())
  today.setHours(0)
  today.setMinutes(0)
  today.setSeconds(0)
  today.setMilliseconds(0)

  return today
}
