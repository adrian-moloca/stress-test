import {
  ILimitedCase,
  OperatingRoom,
  calendarExpandSlotHeight,
  calendarTargetColumnsShown,
  calendarPaddingAdjust,
  calendardHoursWidth,
  dayMinWidth,
  drawerWidth,
  ICaseBackup,
  calendarSpaceBetweenColumns,
} from '@smambu/lib.constants'
import React from 'react'
import { useAppSelector } from 'store'
import { Day } from './Day'
import { getFiveMinutesSlotsArray } from 'hooks'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import { Box, IconButton } from '@mui/material'
import { format } from 'date-fns'
import { HourSlot } from 'pages/Calendar'
import { useGetScreenSize } from 'hooks/uiHooks'
import DayTabHeader from './DayTabHeader'

interface IDayTabProps {
  edit: boolean
  date: Date
  orIds: string[]
  draggingCaseId?: string
  setDraggingCaseId?: (value: string) => void
  cases: ILimitedCase[]
  expandedBefore: boolean
  setExpandedBefore: (value: boolean) => void
  expandedAfter: boolean
  setExpandedAfter: (value: boolean) => void
  toggleEditMode: () => void
  schedulingEnabled: boolean
  openSidebar?: boolean
  lockedWeekCaseBackup: Record<string, ICaseBackup>
}

export const Hours = ({
  setExpandedBefore,
  setExpandedAfter,
  expandedBefore,
  expandedAfter,
  date,
}: {
  date: Date
  expandedBefore: boolean
  setExpandedBefore: (value: boolean) => void
  expandedAfter: boolean
  setExpandedAfter: (value: boolean) => void
}) => {
  const slotList = getFiveMinutesSlotsArray({
    date,
    expandedAfter,
    expandedBefore,
  })

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: calendardHoursWidth,
        background: 'white',
        position: 'sticky',
        left: 0,
        zIndex: 1,
      }}
    >
      {setExpandedBefore
        ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
              height: calendarExpandSlotHeight,
            }}
          >
            <IconButton sx={{ p: 0, fontSize: 10 }}
              onClick={() => setExpandedBefore(!expandedBefore)}>
              {expandedBefore ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Box>
        )
        : null}
      {slotList.map(slot => (
        <HourSlot key={format(slot, 'HH:mm')} slot={slot} />
      ))}
      {setExpandedAfter
        ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
              height: calendarExpandSlotHeight,
            }}
          >
            <IconButton sx={{ p: 0 }} onClick={() => setExpandedAfter(!expandedAfter)}>
              {expandedAfter ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        )
        : null}
    </Box>
  )
}

export const DayTab = ({
  edit,
  date,
  orIds,
  setDraggingCaseId,
  draggingCaseId,
  cases,
  expandedBefore,
  setExpandedBefore,
  expandedAfter,
  setExpandedAfter,
  toggleEditMode,
  schedulingEnabled,
  openSidebar,
  lockedWeekCaseBackup,
}: IDayTabProps) => {
  const { width } = useGetScreenSize()
  const operatingRoomsRaw = useAppSelector(state => state.operatingRooms)
  const operatingRooms: OperatingRoom[] = Object.values(operatingRoomsRaw)
    .filter(or => orIds.includes(or.operatingRoomId))

  const columnWidth =
    (width -
      calendardHoursWidth -
      calendarPaddingAdjust -
      (operatingRooms.length * calendarSpaceBetweenColumns) -
      (openSidebar ? drawerWidth : 0)) /
    Math.min(operatingRooms.length, calendarTargetColumnsShown)
  const realWidth = Math.max(dayMinWidth, columnWidth)
  const orFlexBasis = `${realWidth}px`

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          width: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <DayTabHeader
          date={date}
          operatingRooms={operatingRooms}
          orFlexBasis={orFlexBasis}
        />
        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          <Hours
            setExpandedAfter={setExpandedAfter}
            setExpandedBefore={setExpandedBefore}
            expandedAfter={expandedAfter}
            expandedBefore={expandedBefore}
            date={date}
          />
          {operatingRooms.map((or, index) => (
            <Box sx={{ flex: '1 0', flexBasis: orFlexBasis, display: 'flex' }} key={or.operatingRoomId}>
              <Day
                key={index}
                edit={edit}
                date={date}
                operatingRoomId={or.operatingRoomId}
                setDraggingCaseId={setDraggingCaseId}
                draggingCaseId={draggingCaseId}
                cases={cases}
                expandedBefore={expandedBefore}
                expandedAfter={expandedAfter}
                setExpandedBefore={setExpandedBefore}
                setExpandedAfter={setExpandedAfter}
                toggleEditMode={toggleEditMode}
                schedulingEnabled={schedulingEnabled}
                columnWidth={realWidth}
                lockedWeekCaseBackup={lockedWeekCaseBackup}
                isFirstOr={index === 0}
                isLastOr={index === operatingRooms.length - 1}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </>
  )
}
