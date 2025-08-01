import { calendarExpandSlotHeight, calendarTimeHeightPx, ICaseBackup, ILimitedCase } from '@smambu/lib.constants'
import React from 'react'
import { differenceInMinutes, isBefore, isSameDay } from 'date-fns'
import {
  getCaseOffset,
  getFiveMinutesSlotsArray,
  useGetDragginCaseContractSurgerySlotsByDay,
  useIsOperatingRoomAvailable,
} from 'hooks'
import { Box } from '@mui/material'
import { CalendarSlot } from './CalendarSlot'
import { useAppSelector } from 'store'
interface IDayProps {
  edit: boolean
  date: Date
  operatingRoomId: string
  draggingCaseId?: string
  setDraggingCaseId?: (value: string) => void
  zIndex?: number
  cases: ILimitedCase[]
  expandedBefore?: boolean
  expandedAfter?: boolean
  setExpandedBefore?: (value: boolean) => void
  setExpandedAfter?: (value: boolean) => void
  toggleEditMode?: () => void
  schedulingEnabled?: boolean
  columnWidth?: number
  lockedWeekCaseBackup: Record<string, ICaseBackup>
  isFirstOr: boolean
  isLastOr: boolean
}

export const Day = ({
  edit,
  date,
  operatingRoomId,
  setDraggingCaseId,
  draggingCaseId,
  zIndex,
  cases,
  expandedBefore = false,
  expandedAfter = false,
  setExpandedBefore,
  setExpandedAfter,
  toggleEditMode,
  schedulingEnabled,
  columnWidth,
  lockedWeekCaseBackup,
  isFirstOr,
  isLastOr,
}: IDayProps) => {
  const isOperatingRoomAvailable = useIsOperatingRoomAvailable()

  const contracts = useAppSelector(state => state.contracts)

  const getDragginCaseContractSurgerySlotsByDay = useGetDragginCaseContractSurgerySlotsByDay()
  const slotList = getFiveMinutesSlotsArray({
    date,
    expandedAfter,
    expandedBefore,
  })
  const isRoomAvailable = isOperatingRoomAvailable({ operatingRoomId, date })

  const filteredAndSortedCases = cases
    .filter(
      c => isSameDay(new Date(c.bookingSection.date), date) &&
        operatingRoomId && c.operatingRoomId === operatingRoomId,
    )
    .sort((a, b) => (isBefore(new Date(a.bookingSection.date),
      new Date(b.bookingSection.date))
      ? -1
      : 1))

  const dayCases = filteredAndSortedCases.map((c, index) => ({
    ...c,
    edited: lockedWeekCaseBackup?.[c.caseId] != null,
    zIndex: index + 10,
    offset: getCaseOffset(filteredAndSortedCases, index, contracts),
  }))

  const surgerySlots = getDragginCaseContractSurgerySlotsByDay({
    draggingCaseId,
    day: date,
  })

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        alignItems: 'center',
        flex: `0 0 ${columnWidth}px`,
        backgroundColor: theme => (!isRoomAvailable ? theme.palette.background.default : 'inherit'),
        zIndex,
        borderRadius: theme => theme.constants.radius,
        maxWidth: '100%',
      }}
    >
      {setExpandedBefore ? <Box sx={{ height: calendarExpandSlotHeight }} /> : null}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          position: 'relative',
        }}
      >
        {slotList.map((slot, index) => (
          <CalendarSlot
            key={index}
            index={index}
            edit={edit}
            slot={slot}
            cases={dayCases}
            isRoomAvailable={isRoomAvailable}
            setDraggingCaseId={setDraggingCaseId}
            operatingRoomId={operatingRoomId}
            toggleEditMode={toggleEditMode}
            schedulingEnabled={schedulingEnabled}
            columnWidth={columnWidth}
            isFirstOr={isFirstOr}
            isLastOr={isLastOr}
          />
        ))}
        {isRoomAvailable &&
          surgerySlots?.map((slot, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: theme => theme.palette.customColors.calendarHighlightSlot,
                position: 'absolute',
                top: (differenceInMinutes(slot.from, slotList[0]) / 5) * calendarTimeHeightPx,
                left: 0,
                right: 0,
                height: (differenceInMinutes(slot.to, slot.from) / 5) * calendarTimeHeightPx,
                zIndex: -1,
              }}
            />
          ))}
        {setExpandedAfter ? <Box sx={{ height: calendarExpandSlotHeight }} /> : null}
      </Box>
    </Box>
  )
}
