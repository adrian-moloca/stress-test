export const today = () => {
  const now = new Date(Date.now())

  now.setHours(0)
  now.setMinutes(0)
  now.setSeconds(0)
  now.setMilliseconds(0)

  const year = now.getFullYear()
  const month = now.toLocaleDateString('en', { month: '2-digit' })
  const day = now.toLocaleDateString('en', { day: '2-digit' })

  const date = `${year}-${month}-${day}`
  const dateIsoString = now.toISOString()

  return { date, dateIsoString }
}
