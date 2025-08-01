import { Box } from '@mui/material'
import { useAppSelector } from 'store'
import React from 'react'
import Day from './Day'
import {
  ILimitedCase,
  calendarPaddingAdjust,
  calendarTargetColumnsShown,
  calendardHoursWidth,
  dayMinWidth,
  drawerWidth,
} from '@smambu/lib.constants'
import { useGetScreenSize } from 'hooks/uiHooks'
import { getFiveMinutesSlotsArray } from 'hooks'
import { Hours } from 'components/pages/Calendar/Calendar/DayTab'

const DayTab = ({
  date,
  orId,
  draggingAnesthesiologistId,
  cases,
  expandedBefore,
  setExpandedBefore,
  expandedAfter,
  setExpandedAfter,
  openSidebar,
  timeStamp,
}: {
  date: Date
  orId: string
  draggingAnesthesiologistId: string
  cases: Record<string, ILimitedCase>
  expandedBefore: boolean
  setExpandedBefore: (value: boolean) => void
  expandedAfter: boolean
  setExpandedAfter: (value: boolean) => void
  openSidebar: boolean
  timeStamp: number
}) => {
  const { width } = useGetScreenSize()
  const operatingRooms = Object.values(useAppSelector(state => state.operatingRooms))

  const targetWidth =
    (width -
      calendardHoursWidth -
      calendarPaddingAdjust -
      (operatingRooms.length * 10) -
      (openSidebar ? drawerWidth : 0)) /
    Math.min(operatingRooms.length, calendarTargetColumnsShown)
  const columnWidth = Math.max(dayMinWidth, targetWidth)
  const slotList = React.useMemo(
    () => getFiveMinutesSlotsArray({ date, expandedBefore, expandedAfter }),
    [date, expandedBefore, expandedAfter],
  )

  return (
    <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
      <Box>
        <Box sx={{ height: 48, bgcolor: 'background.paper', zIndex: 2, position: 'sticky', top: 0 }} />
        <Hours
          expandedBefore={expandedBefore}
          setExpandedBefore={setExpandedBefore}
          expandedAfter={expandedAfter}
          setExpandedAfter={setExpandedAfter}
          date={date}
        />
      </Box>
      {orId === 'all'
        ? (
          operatingRooms.map((or: any, index) => (
            <Day
              key={index}
              date={date}
              showDay={false}
              operatingRoomId={or.operatingRoomId}
              draggingAnesthesiologistId={draggingAnesthesiologistId}
              cases={cases}
              setExpandedBefore={setExpandedBefore}
              setExpandedAfter={setExpandedAfter}
              columnWidth={columnWidth}
              slotList={slotList}
              timeStamp={timeStamp}
              isFirstOr={index === 0}
              isLastOr={index === operatingRooms.length - 1}
            />
          ))
        )
        : (
          <Day
            date={date}
            showDay={false}
            operatingRoomId={orId}
            draggingAnesthesiologistId={draggingAnesthesiologistId}
            cases={cases}
            setExpandedBefore={setExpandedBefore}
            setExpandedAfter={setExpandedAfter}
            columnWidth={columnWidth}
            slotList={slotList}
            timeStamp={timeStamp}
            isFirstOr
            isLastOr
          />
        )}
    </Box>
  )
}

export default DayTab
