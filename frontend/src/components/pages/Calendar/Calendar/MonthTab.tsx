import { dayMaxWidth, ILimitedCase } from '@smambu/lib.constants'
import React from 'react'
import { endOfMonth, format, setDay } from 'date-fns'
import { getArrayfromDateRange } from 'hooks'
import { Box, Typography } from '@mui/material'
import { formatWithLocale } from 'utilities'
import { MonthlyCalendarCell } from './MonthlyCalendarCell'

interface IMonthTabProps {
  edit: boolean
  date: Date
  orIds: string[]
  setDate: (date: Date) => void
  cases: ILimitedCase[]
  path: string
}

export const MonthTab = ({ edit, date, orIds, setDate, cases, path }: IMonthTabProps) => {
  const dateArray = getArrayfromDateRange({
    startDate: date,
    endDate: endOfMonth(date),
  })
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 0].map(day => (
          <Box
            key={day}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: dayMaxWidth,
              width: 'calc(100% / 7)',
              p: 2,
            }}
          >
            <Typography variant='h6'>{formatWithLocale(setDay(new Date(), day), 'EEE')}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
        {dateArray.map((day, index) => (
          <MonthlyCalendarCell
            key={day ? format(day, 'dd-MM-yyyy') : index}
            {...{
              edit,
              day: day!,
              orIds,
              setDate,
              cases,
              path,
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
