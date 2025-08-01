import { ILimitedCase, calendarSpaceBetweenColumns, calendarTimeHeightPx } from '@smambu/lib.constants'
import { Box } from '@mui/material'
import { add, differenceInSeconds, isAfter, isBefore } from 'date-fns'
import React from 'react'
import CaseCard from './CaseCard'

const CalendarSlot = ({
  index,
  cases,
  slot,
  timeStamp,
  isFirstOr,
  isLastOr,
}: {
  index: number
  cases: ILimitedCase[]
  slot: Date
  timeStamp: number
  isFirstOr: boolean
  isLastOr: boolean
}) => {
  const [secondsFromTop, setSecondsFromTop] = React.useState<null | number>(null)
  const maxSlotDate = add(slot, { minutes: 5, seconds: -1 })
  const minSlotDate = add(slot, { seconds: -1 })
  const slotCases = cases.filter(
    c =>
      isBefore(new Date(c.bookingSection.date), maxSlotDate) &&
      isAfter(new Date(c.bookingSection.date), minSlotDate),
  )

  React.useEffect(() => {
    const calcSecondsFromTop = () => {
      const newNow = new Date()
      const isNow = isBefore(minSlotDate, newNow) && isBefore(newNow, maxSlotDate)
      if (isNow)
        setSecondsFromTop(differenceInSeconds(newNow, minSlotDate))
      else
        setSecondsFromTop(null)
    }

    const interval = setInterval(() => {
      calcSecondsFromTop()
    }, 1000 * 60)

    calcSecondsFromTop()
    return () => clearInterval(interval)
  }, [minSlotDate, maxSlotDate])

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {secondsFromTop != null
        ? (
          <Box
            sx={{
              position: 'absolute',
              top: `${(secondsFromTop * 100) / 300}%`,
              left: isFirstOr ? 0 : -calendarSpaceBetweenColumns,
              right: isLastOr ? 0 : -calendarSpaceBetweenColumns,
              zIndex: 1000,
              height: '1px',
              backgroundColor: theme => theme.palette.error.main,
            }}
          />
        )
        : null}
      <Box
        sx={{
          height: calendarTimeHeightPx,
          flexGrow: 1,
          borderTop: '1px solid',
          borderColor: theme =>
            !index || index % 6 === 0
              ? theme.palette.customColors.mainSlots
              : theme.palette.customColors.secondarySlots,
          zIndex: 'inherit',
          position: 'relative',
        }}
      >
        {slotCases.map(c => (
          <CaseCard key={c.caseId} c={c} timeStamp={timeStamp} />
        ))}
      </Box>
    </Box>
  )
}

export default CalendarSlot
