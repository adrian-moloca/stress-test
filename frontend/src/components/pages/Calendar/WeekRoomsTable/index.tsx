import React from 'react'
import { Typography, Box, SxProps, Theme } from '@mui/material'
import { formatWithLocale, trlb } from 'utilities'
import { add, startOfWeek } from 'date-fns'
import { ILimitedCase, dayMaxWidth } from '@smambu/lib.constants'
import WeekRoomsTableCell from 'components/pages/Calendar/WeekRoomsTableCell'
import { useAppSelector } from 'store'

interface WeekRoomsTableProps {
  edit: boolean
  date: Date
  setDraggingCaseId?: (id: string) => void
  sx?: SxProps<Theme>
  cases: ILimitedCase[]
  toggleEditMode?: () => void
  orIds?: string[]
}

const WeekRoomsTable = ({
  edit,
  date,
  setDraggingCaseId,
  sx,
  cases,
  toggleEditMode,
  orIds
}: WeekRoomsTableProps) => {
  const operatingRooms = Object.values(useAppSelector(state => state.operatingRooms)).filter(
    or => !orIds || orIds.includes(or.operatingRoomId),
  )
  const startingWeekDay = startOfWeek(date, { weekStartsOn: 1 })

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        position: 'relative',
        ...(sx ?? {}),
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: theme => theme.palette.background.paper,
        }}
      >
        {[-1, 0, 1, 2, 3, 4, 5, 6].map(day => (
          <Box
            key={day}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: dayMaxWidth,
              width: 'calc(100% / 8)',
              px: 2,
              pt: 1,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
              {day < 0
                ? trlb('calendar_weekRoomsTable_ors')
                : formatWithLocale(add(startingWeekDay, { days: day }), 'EEE d')}
            </Typography>
          </Box>
        ))}
      </Box>
      {operatingRooms.map(or => {
        return (
          <Box
            key={or.operatingRoomId}
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: () => 'inherit',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: dayMaxWidth,
                p: 2,
                width: 'calc(100% / 8)',
              }}
            >
              {or.name}
            </Box>
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <WeekRoomsTableCell
                key={day}
                {...{
                  day,
                  date: add(startingWeekDay, { days: day }),
                  edit,
                  or,
                  setDraggingCaseId,
                  cases,
                  toggleEditMode,
                }}
              />
            ))}
          </Box>
        )
      })}
    </Box>
  )
}

export default WeekRoomsTable
