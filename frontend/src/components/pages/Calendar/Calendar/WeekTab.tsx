import { ICaseBackup, ILimitedCase, calendarPaddingAdjust, calendardHoursWidth, drawerWidth } from '@smambu/lib.constants'
import React from 'react'
import { add, isSameWeek } from 'date-fns'
import { Box, Typography } from '@mui/material'

import WeekRoomsTable from 'components/pages/Calendar/WeekRoomsTable'
import { Day } from './Day'
import { Hours } from './DayTab'
import { formatWithLocale } from 'utilities'
import { useGetScreenSize } from 'hooks/uiHooks'

interface IWeekTabProps {
  edit: boolean
  date: Date
  orIds: string[]
  draggingCaseId?: string
  setDraggingCaseId?: (value: string) => void
  cases: ILimitedCase[]
  expandedBefore: boolean
  expandedAfter: boolean
  toggleEditMode: () => void
  setExpandedAfter: (value: boolean) => void
  setExpandedBefore: (value: boolean) => void
  openSidebar?: boolean
  schedulingEnabled?: boolean
  lockedWeekCaseBackup: Record<string, ICaseBackup>
}

export const WeekTab = ({
  edit,
  date,
  orIds,
  setDraggingCaseId,
  draggingCaseId,
  cases,
  expandedBefore,
  expandedAfter,
  toggleEditMode,
  setExpandedAfter,
  setExpandedBefore,
  openSidebar,
  schedulingEnabled,
  lockedWeekCaseBackup,
}: IWeekTabProps) => {
  const { width } = useGetScreenSize()
  const filteredCases = cases.filter(c => isSameWeek(new Date(c.bookingSection.date),
    date,
    { weekStartsOn: 1 }))

  if (orIds.length === 1) {
    const weekDays = [0, 1, 2, 3, 4, 5, 6]
    const columnWidth =
      (width - calendardHoursWidth - calendarPaddingAdjust - (weekDays.length * 10) - (openSidebar
        ? drawerWidth
        : 0)) /
      weekDays.length

    return (
      <>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            width: '100%',
            overflowX: 'scroll',
            overflowY: 'scroll',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, position: 'sticky', background: 'white', top: 0, zIndex: 2 }}>
            <Box
              sx={{
                width: `${calendardHoursWidth}px`,
                minWidth: `${calendardHoursWidth}px`,
                background: 'white',
                position: 'sticky',
                left: 0,
              }}
            />
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <Box
                key={day}
                sx={{
                  flex: `1 0 ${columnWidth}px`,
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  background: 'white',
                }}
              >
                <Typography variant='h6'>{formatWithLocale(add(date, { days: day }), 'EEE d')}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, zIndex: 1 }}>
            <Hours
              setExpandedAfter={setExpandedAfter}
              setExpandedBefore={setExpandedBefore}
              expandedAfter={expandedAfter}
              expandedBefore={expandedBefore}
              date={date}
            />
            {weekDays.map((day, index) => (
              <Day
                key={index}
                edit={edit}
                date={add(date, { days: day })}
                operatingRoomId={orIds[0]}
                setDraggingCaseId={setDraggingCaseId}
                draggingCaseId={draggingCaseId}
                zIndex={10 - index}
                cases={filteredCases}
                expandedBefore={expandedBefore}
                expandedAfter={expandedAfter}
                setExpandedAfter={setExpandedAfter}
                setExpandedBefore={setExpandedBefore}
                toggleEditMode={toggleEditMode}
                columnWidth={columnWidth}
                schedulingEnabled={schedulingEnabled}
                lockedWeekCaseBackup={lockedWeekCaseBackup}
                isFirstOr
                isLastOr
              />
            ))}
          </Box>
        </Box>
      </>
    )
  }

  return (
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
      <WeekRoomsTable
        edit={edit}
        date={date}
        setDraggingCaseId={setDraggingCaseId}
        cases={filteredCases}
        toggleEditMode={toggleEditMode}
        orIds={orIds}
      />
    </Box>
  )
}
