import { tExplorerData } from '@smambu/lib.constants'
import { Box } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'
import { addDays, addMonths, addWeeks, differenceInDays, differenceInMonths, differenceInWeeks, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { BarWidget, CardWidget } from './WidgetComponents'

const Widgets = ({
  data, startDate, endDate
}: {
  data: tExplorerData, startDate: string, endDate: string
}) => {
  const arrayLength = React.useMemo(() => {
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    let arrayLength = 1
    if (data.dateGranularity === 'days')
      arrayLength = differenceInDays(endDateObj, startDateObj)
    else if (data.dateGranularity === 'weeks')
      arrayLength = differenceInWeeks(endDateObj, startDateObj)
    else if (data.dateGranularity === 'months')
      arrayLength = differenceInMonths(endDateObj, startDateObj)
    return arrayLength + 1
  }, [data.dateGranularity, endDate, startDate])

  const getDateString = React.useCallback((i: number) => {
    let date = new Date(startDate)
    let periodStartDate: Date = new Date()
    let periodEndDate: Date = new Date()
    let formatString = 'yyyy-MM-dd'
    if (data.dateGranularity === 'days') {
      date = addDays(date, i)
      periodStartDate = date
    } else if (data.dateGranularity === 'weeks') {
      formatString = 'yyyy-ww'
      date = addWeeks(date, i)
      periodStartDate = startOfWeek(date, { weekStartsOn: 1 })
      periodEndDate = endOfWeek(date, { weekStartsOn: 1 })
    } else if (data.dateGranularity === 'months') {
      date = addMonths(date, i)
      formatString = 'yyyy-MM'

      periodStartDate = startOfMonth(date)
    }
    const dateStr = format(date, formatString)
    return { dateStr, periodStartDate, periodEndDate }
  }, [data.dateGranularity, startDate])

  const fillMissingTimePeriods = React.useCallback((data: { _id: string, count: number }[]) => {
    const arrayFromStartDateToEndDate = Array.from({ length: arrayLength }, (_, i) => {
      const { dateStr, periodStartDate, periodEndDate } = getDateString(i)
      const found = data.find(d => d._id === dateStr)
      return {
        _id: dateStr,
        count: found ? found.count : 0,
        periodStartDate,
        periodEndDate
      }
    })
    return arrayFromStartDateToEndDate
  }, [getDateString, arrayLength])

  const filledExecutedCasesByTimePeriod = React.useMemo(() => {
    return fillMissingTimePeriods(data.executedCasesByTimePeriod)
  }, [data.executedCasesByTimePeriod, fillMissingTimePeriods])

  const filledOrsOccupancyByTimePeriod = React.useMemo(() => {
    return fillMissingTimePeriods(data.orsOccupancy)
      .map(d => ({
        ...d,
        count: (d.count / 60).toFixed(0)
      }))
  }, [data.orsOccupancy, fillMissingTimePeriods])

  const executedCasesPercentage = data.totalCases === 0
    ? '0'
    : ((data.executedCases / data.totalCases) * 100).toFixed(2)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
          <CardWidget
            title={trlb('explorer_totalCases_title')}
            value={String(data.totalCases)}
          />
          <CardWidget
            title={trlb('explorer_executedCases_title')}
            value={trlb('explorer_executedCases_count', { count: String(data.executedCases), percentage: executedCasesPercentage })}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', gap: 2 }}>
        <BarWidget
          title={trlb(`explorer_executedCasesByTimePeriod_${data.dateGranularity}_title`)}
          data={filledExecutedCasesByTimePeriod}
          dateGranularity={data.dateGranularity}
          countLabel='explorer_executedCasesByTimePeriod_count_label'
        />
        <BarWidget
          title={trlb(`explorer_orsOccupancy_${data.dateGranularity}_title`)}
          data={filledOrsOccupancyByTimePeriod}
          dateGranularity={data.dateGranularity}
          countLabel='explorer_orsOccupancy_count_label'
        />
      </Box>
    </Box>
  )
}

export default Widgets
