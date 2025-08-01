import { explorerTimePeriods, explorerTimePeriodOptions } from '@smambu/lib.constants'
import { Box, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { FlexSelector } from 'components/FlexCommons'
import { differenceInDays, isAfter, isValid, parseISO, subDays } from 'date-fns'
import React from 'react'
import { useDispatch } from 'react-redux'
import { EXPLORER_ACTION } from 'store/actions'
import { trlb } from 'utilities'

const explorerDaysLimit = import.meta.env.VITE_EXPLORER_MAXIMUM_DAYS

const FilterBar = ({
  startDate,
  endDate,
}: {
  startDate: string
  endDate: string
}) => {
  const [tempStartDate, setTempStartDate] = React.useState<Date | null>(parseISO(startDate))
  const [tempEndDate, setTempEndDate] = React.useState<Date | null>(parseISO(endDate))

  React.useEffect(() => {
    setTempStartDate(parseISO(startDate))
    setTempEndDate(parseISO(endDate))
  }, [startDate, endDate])

  const dispatch = useDispatch()

  const handleDateChange = (newStartDate: Date, newEndDate: Date) => {
    if (differenceInDays(newEndDate, newStartDate) > explorerDaysLimit)
      newStartDate = subDays(newEndDate, explorerDaysLimit)

    dispatch({
      type: EXPLORER_ACTION.SET_EXPLORER_FILTERS,
      data: {
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
      },
    })
  }

  const timePeriod = Object.values(explorerTimePeriods).find(
    period => {
      return startDate === period.startDate && endDate === period.endDate
    },
  )?.value ?? ''

  const setTimePeriod = (value: string) => {
    const explorerTimePeriod = explorerTimePeriods[value]
    dispatch({
      type: EXPLORER_ACTION.SET_EXPLORER_FILTERS,
      data: {
        startDate: explorerTimePeriod.startDate,
        endDate: explorerTimePeriod.endDate,
      },
    })
  }

  const error = isValid(tempStartDate) && isValid(tempEndDate) &&
    isAfter(tempStartDate!, tempEndDate!)

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        mt: 1,
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            inputFormat={trlb('dateTime_date_string')}
            label={trlb('commons_start_date')}
            value={tempStartDate}
            onChange={newValue => {
              setTempStartDate(newValue)
              if (isValid(newValue)) handleDateChange(newValue!, tempEndDate!)
            }}
            renderInput={(params: any) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...params}
                error={params.error || error}
              />
            )}
          />
          <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>{trlb('dateTime_dateRange_separator')}</Box>
          <DatePicker
            inputFormat={trlb('dateTime_date_string')}
            label={trlb('commons_end_date')}
            value={tempEndDate}
            onChange={newValue => {
              setTempEndDate(newValue)
              if (isValid(newValue)) handleDateChange(tempStartDate!, newValue!)
            }}
            renderInput={(params: any) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...params}
                error={params.error || error}
              />
            )}
          />
        </Box>
        {error != null
          ? (
            <Typography variant='caption' color='error'>
              {error}
            </Typography>
          )
          : null}
      </Box>
      <FlexSelector
        label='cases_timePeriod'
        value={timePeriod}
        onChange={setTimePeriod}
        options={explorerTimePeriodOptions}
        sx={{ width: '200px' }}
        noEmptyOption
      />
    </Box>
  )
}

export default FilterBar
