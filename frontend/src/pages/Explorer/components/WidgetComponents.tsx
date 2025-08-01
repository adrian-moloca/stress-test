import { Box, Theme, Typography, useTheme } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { Panel } from 'components/Commons'

export const CardWidget = ({ title, value }: { title: string, value: string }) => {
  return (
    <Panel sx={{ width: 550, height: 125, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant='h6'>{title}</Typography>
      <Typography variant='h5'>{value}</Typography>
    </Panel>
  )
}

const CustomTooltip = ({
  active, payload, dateGranularity, countLabel
}: {
  active?: boolean,
  payload?: {
    value: number,
    payload: { periodStartDate: Date, periodEndDate: Date, formattedCount?: string, count: number }
  }[],
  dateGranularity: string
  countLabel: string
}) => {
  const data = payload && payload[0] ? payload[0].payload : null

  const dateString = dateGranularity === 'months' ? 'dateTime_month_string' : 'dateTime_date_string'

  if (active && data != null)
    return (
      <Panel sx={{ p: 1, border: (theme: Theme) => '1px solid ' + theme.palette.primary.dark }}>
        {dateGranularity === 'weeks'
          ? (
            <Typography>{`${format(data.periodStartDate, trlb('dateTime_date_string'))} - ${format(data.periodEndDate, trlb('dateTime_date_string'))}`}</Typography>
          )
          : (
            <Typography>{format(data.periodStartDate, trlb(dateString))}</Typography>
          )}
        <Typography>
          {trlb(countLabel, { count: String(data.formattedCount ?? data.count) })}
        </Typography>
      </Panel>
    )

  return null
}

export const BarWidget = ({
  title, data, dateGranularity, countLabel
}: {
  title: string,
  data: { _id: string, count: number | string }[],
  dateGranularity: string
  countLabel: string
}) => {
  const theme = useTheme()
  return (
    <Panel sx={{ width: 550, height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <Typography variant='h6'>{title}</Typography>
      <BarChart width={500} height={200} data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='_id' />
        <YAxis dataKey='count' allowDecimals={false} />
        <Tooltip
          content={<CustomTooltip dateGranularity={dateGranularity} countLabel={countLabel} />}
        />
        <Bar dataKey='count' fill={theme.palette.primary.main} />
      </BarChart>
    </Panel>
  )
}

export const PieWidget = ({
  title, data
}: {
  title: string, data: { _id: string, count: number }[]
}) => {
  const theme = useTheme()
  const COLORS = [
    theme.palette.customColors.caseProgressBar0,
    theme.palette.customColors.caseProgressBar1,
    theme.palette.customColors.caseProgressBar2,
  ]

  if (data.length === 0) return (
    <Panel sx={{ width: 550, height: 270, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant='h5'>{title}</Typography>
      <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant='h6'>{trlb('explorer_noData')}</Typography>
      </Box>
    </Panel>
  )

  const Label = ({
    label, value, percent, x, y, fill, midAngle,
  }: {
    label: string, value: number, percent: number,
    x: number, y: number, midAngle: number,
    fill: string,
  }) => {
    const width = 140
    const height = 30
    const quadrant = Math.floor(midAngle / 90)
    const top = quadrant === 0 || quadrant === 1
    const left = quadrant === 1 || quadrant === 2

    return (
      <foreignObject
        x={left ? x - width : x}
        y={!top ? y : y - height}
        width={width}
        height={height}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: left ? 'flex-end' : 'flex-start',
            alignItems: top ? 'flex-end' : 'flex-start',
            height: '100%'
          }}
        >
          <Typography sx={{ color: fill, fontSize: 18 }}>
            {`${label} ${value} (${(percent * 100).toFixed(2)}%)`}
          </Typography>
        </Box>
      </foreignObject>
    )
  }

  return (
    <Panel sx={{ width: 550, height: 270, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant='h5'>{title}</Typography>
      <ResponsiveContainer width='100%' height={200}>
        <PieChart width={360} height={200}>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            innerRadius={0}
            outerRadius={40}
            fill={theme.palette.primary.main}
            dataKey='count'
            label={Label}
          >
            {data.map((_e, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Panel>
  )
}
