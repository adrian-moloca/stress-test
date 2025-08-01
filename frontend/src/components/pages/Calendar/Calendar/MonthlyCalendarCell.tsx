import { dayMaxWidth, ILimitedCase, permissionRequests } from '@smambu/lib.constants'
import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { formatWithLocale } from 'utilities'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useIsOperatingRoomAvailable } from 'hooks'
import { isSameDay } from 'date-fns'
import { CaseBullet } from '../CaseBullet'
import { useNavigate } from 'react-router-dom'

const AggregatedCaseBullet = ({ aggregatedCases, day, setDate, path }) => {
  const navigate = useNavigate()
  return (
    <>
      {Object.keys(aggregatedCases)
        .filter(status => aggregatedCases[status] > 0)
        .map(status => (
          <Box
            key={status}
            onClick={() => {
              setDate(day)
              navigate(path.replace(':view', 'day').replace(':orId', 'all'))
            }}
            sx={{
              borderRadius: theme => theme.constants.radius,
              maxWidth: 200,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              cursor: 'pointer',
            }}
          >
            <Box
              sx={{
                height: theme => theme.spacing(2),
                width: theme => theme.spacing(2),
                backgroundColor: theme => theme.palette.customColors[status],
                borderRadius: theme => theme.constants.radius,
                flexShrink: 0,
              }}
            />
            <Typography variant='caption' sx={{ wordBreak: 'break-all' }}>
              {status + ' - ' + aggregatedCases[status]}
            </Typography>
          </Box>
        ))}
    </>
  )
}

interface IMonthlyCalendarCellProps {
  day: Date
  orIds: string[]
  edit: boolean
  setDate: (date: Date) => void
  cases: ILimitedCase[]
  path: string
}

export const MonthlyCalendarCell = ({
  day,
  orIds,
  edit,
  setDate,
  cases,
  path,
}: IMonthlyCalendarCellProps) => {
  const checkPermission = useGetCheckPermission()
  const isOperatingRoomAvailable = useIsOperatingRoomAvailable()
  const isRoomAvailable = orIds.length !== 1 ||
    isOperatingRoomAvailable({
      operatingRoomId: orIds[0],
      date: day
    })
  const filteredCases = useMemo(
    () =>
      cases
        .filter(c => isSameDay(c.bookingSection.date, day) && orIds.includes(c.operatingRoomId))
        .sort((a, b) => a.bookingSection.date - b.bookingSection.date),
    [cases, day, orIds],
  )
  let aggregatedCases =
    orIds.length === 1
      ? {}
      : filteredCases.reduce((acc, c) => {
        const canViewCaseBookingInfo = checkPermission(permissionRequests.canViewCaseBookingInfo, {
          caseItem: {
            bookingSection: {
              doctorId: c.bookingSection.doctorId,
            },
          },
        })
        const canViewBooking = checkPermission(permissionRequests.canViewBooking, {
          caseItem: {
            bookingSection: {
              doctorId: c.bookingSection.doctorId,
            },
          },
        })
        if (acc[c.status] == null) acc[c.status] = 0
        if (canViewCaseBookingInfo && canViewBooking)
          return { ...acc, [c.status]: acc[c.status] + 1 }

        return acc
      }, {})

  return (
    <Box
      sx={{
        p: 0.5,
        width: 'calc(100% / 7)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: dayMaxWidth,
          position: 'relative',
          backgroundColor: theme =>
            isRoomAvailable
              ? theme.palette.customColors.availableTimeSlot
              : theme.palette.customColors.unavailableTimeSlot,
          p: 1,
          borderRadius: theme => theme.constants.radius,
          width: '100%',
          height: '100%',
        }}
      >
        {day
          ? (
            <Box
              sx={{
                position: 'absolute',
                top: theme => theme.spacing(1),
                left: theme => theme.spacing(1),
                backgroundColor: theme => theme.palette.panel.main,
                py: '2px',
                px: '5px',
                borderRadius: theme => theme.constants.radius,
              }}
            >
              {formatWithLocale(day, 'dd')}
            </Box>
          )
          : null}
        <Box sx={{ width: '100%', height: theme => theme.spacing(3) }} />
        {orIds.length > 1
          ? (
            <AggregatedCaseBullet {...{ aggregatedCases, day, setDate, path }} />
          )
          : (
            filteredCases.map(c => (
              <CaseBullet key={c.caseId} c={c} edit={edit} setDraggingCaseId={() => { }}>
                <div />
              </CaseBullet>
            ))
          )}
      </Box>
    </Box>
  )
}
