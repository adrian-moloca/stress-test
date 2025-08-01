import React from 'react'
import { Typography, Box, IconButton } from '@mui/material'
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined'
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined'
import { add, isSameDay, isSameMonth, isSameWeek, startOfDay, startOfMonth, startOfWeek, sub } from 'date-fns'
import { calendarDateString } from '@smambu/lib.constants'
import { Today } from '@mui/icons-material'
import { formatWithLocale } from 'utilities'

interface NavMenuProps {
  date: Date
  setDate: (val: Date) => void
  timeStep: string
}

const NavMenu = ({ date, setDate, timeStep }: NavMenuProps) => {
  const today = startOfDay(new Date())
  let startDate = null
  let isToday = false

  switch (timeStep) {
    case 'weeks':
      startDate = startOfWeek(date, { weekStartsOn: 1 })
      isToday = isSameWeek(date, today, { weekStartsOn: 1 })
      break
    case 'months':
      startDate = startOfMonth(date)
      isToday = isSameMonth(date, today)
      break
    case 'days':
    default:
      startDate = date
      isToday = isSameDay(date, today)
      break
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 300 }}>
      <IconButton onClick={() => setDate(sub(date, { [timeStep]: 1 }))} sx={{ bgcolor: 'primary.light' }}>
        <NavigateBeforeOutlinedIcon />
      </IconButton>
      <IconButton disabled={isToday} onClick={() => setDate(today)} sx={{ bgcolor: 'primary.light' }}>
        <Today />
      </IconButton>
      <Typography
        variant='h6'
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme => theme.palette.primary.main,
        }}
      >
        {timeStep === 'days'
          ? formatWithLocale(startDate, calendarDateString)
          : formatWithLocale(startDate, calendarDateString) +
            ' - ' +
            formatWithLocale(
              add(startDate, {
                [timeStep]: 1,
                days: -1,
              }),
              calendarDateString,
            )}
      </Typography>
      <IconButton onClick={() => setDate(add(date, { [timeStep]: 1 }))} sx={{ bgcolor: 'primary.light' }}>
        <NavigateNextOutlinedIcon />
      </IconButton>
    </Box>
  )
}

export default NavMenu
