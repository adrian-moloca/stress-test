import {
  calendardHoursWidth,
  getDayTimestamp,
  getFullName,
  OperatingRoom,
  permissionRequests
} from '@smambu/lib.constants'
import { Box, Typography } from '@mui/material'
import { useCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useAppSelector } from 'store'

const timeZone = import.meta.env.VITE_TIME_ZONE

type IDayTabHeaderProps = {
  operatingRooms: OperatingRoom[]
  date: Date
  orFlexBasis: string
}

const DayTabHeader = ({
  operatingRooms,
  date,
  orFlexBasis,
}: IDayTabHeaderProps) => {
  const canViewAnesthesiologists = useCheckPermission(permissionRequests.canViewAnesthesiologists)
  const users = useAppSelector(state => state.users)
  const orScheduling = useAppSelector(state => state.orScheduling)
  const dayTimeStamp = getDayTimestamp(date, timeZone)

  return (
    <Box sx={{ display: 'flex', gap: 1, position: 'sticky', background: 'white', top: 0, zIndex: 1200 }}>
      <Box
        sx={{
          width: `${calendardHoursWidth}px`,
          minWidth: `${calendardHoursWidth}px`,
          background: 'white',
          position: 'sticky',
          left: 0,
        }}
      />
      {operatingRooms.map(or => {
        // We don't want to show the anesthesiologists if the schedule is edited until is re-loaded
        const orSchedule = orScheduling.some(o => o.edited)
          ? null
          : orScheduling.find(o => o.operatingRoomId === or.operatingRoomId &&
            o.timeStamp === dayTimeStamp)

        const dayAnesthesiologists = canViewAnesthesiologists && orSchedule != null
          ? orSchedule.anestIds.map(id => getFullName(users[id], true))
            .filter(Boolean)
          : []

        return (
          <Box
            key={or.operatingRoomId}
            sx={{
              flex: '1 0',
              flexBasis: orFlexBasis,
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              width: '100%',
              background: 'white',
              textAlign: 'center',
            }}
          >
            <Typography variant='h6'>{or.name}</Typography>
            {dayAnesthesiologists.length > 0 && <Typography variant='body2'>{dayAnesthesiologists.join(', ')}</Typography>}
          </Box>
        )
      })}
    </Box>
  )
}

export default DayTabHeader
