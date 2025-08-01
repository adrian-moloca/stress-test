import { ILimitedCase, calendarExpandSlotHeight } from '@smambu/lib.constants'
import { Box, Typography } from '@mui/material'
import { format, isBefore, isSameDay } from 'date-fns'
import { getCaseOffset, useIsOperatingRoomAvailable } from 'hooks'
import React from 'react'
import CalendarSlot from './CalendarSlot'
import RoomDropZone from './RoomDropZone'
import { useAppSelector } from 'store'

const Day = ({
  date,
  showDay = true,
  operatingRoomId,
  draggingAnesthesiologistId,
  zIndex,
  cases,
  slotList,
  setExpandedBefore,
  setExpandedAfter,
  columnWidth,
  timeStamp,
  isFirstOr,
  isLastOr,
}: {
  date: Date
  showDay?: boolean
  operatingRoomId?: string
  draggingAnesthesiologistId: string
  zIndex?: number
  cases: Record<string, ILimitedCase>
  slotList: Date[]
  setExpandedBefore?: (value: boolean) => void
  setExpandedAfter?: (value: boolean) => void
  columnWidth: number
  timeStamp: number
  isFirstOr: boolean
  isLastOr: boolean
}) => {
  const isOperatingRoomAvailable = useIsOperatingRoomAvailable()

  const contracts = useAppSelector(state => state.contracts)

  const isRoomAvailable = isOperatingRoomAvailable({ operatingRoomId, date })
  const filteredAndSortedCases = Object.values(cases)
    .filter(c => isSameDay(c.bookingSection.date, date) &&
      (!operatingRoomId || c.operatingRoomId === operatingRoomId))
    .sort((a, b) => (isBefore(a.bookingSection.date, b.bookingSection.date) ? -1 : 1))
  const dayCases = filteredAndSortedCases.map((c, index) => ({
    ...c,
    zIndex: index + 10,
    offset: getCaseOffset(filteredAndSortedCases, index, contracts),
  }))

  return (
    <Box
      sx={{
        maxHeight: '100%',
        width: columnWidth,
        minWidth: columnWidth,
        backgroundColor: theme => (!isRoomAvailable ? theme.palette.background.default : 'inherit'),
        zIndex,
        borderRadius: theme => theme.constants.radius,
      }}
    >
      {showDay ? <Typography variant='h6'>{format(date, 'EEE d')}</Typography> : null}
      {!showDay && operatingRoomId
        ? (
          <RoomDropZone
            draggingAnesthesiologistId={draggingAnesthesiologistId}
            operatingRoomId={operatingRoomId}
            date={date}
            timeStamp={timeStamp}
          />
        )
        : null}
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Box
          sx={{
            width: '100%',
            position: 'relative',
            zIndex: 0,
          }}
        >
          {setExpandedBefore ? <Box sx={{ height: calendarExpandSlotHeight }} /> : null}
          {slotList.map((slot, index) => (
            <CalendarSlot
              key={format(slot, 'HH:mm')}
              index={index}
              slot={slot}
              cases={dayCases}
              timeStamp={timeStamp}
              isLastOr={isLastOr}
              isFirstOr={isFirstOr}
            />
          ))}
          {setExpandedAfter ? <Box sx={{ height: calendarExpandSlotHeight }} /> : null}
        </Box>
      </Box>
    </Box>
  )
}

export default Day
