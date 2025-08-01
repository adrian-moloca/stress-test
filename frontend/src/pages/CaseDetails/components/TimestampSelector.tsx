import React from 'react'
import { Box, Button, Grid, Typography } from '@mui/material'
import { Panel } from 'components/Commons'
import TimestampPicker from './TimestampPicker'

const TimestampSelector = ({
  value,
  canSetTimestamp,
  canEditTimestamp,
  edit,
  onChange,
  timestampLabel,
  timeStampSetLabel,
  xs,
  md,
  lg,
  xl,
  warning,
}: {
  value: Date | null
  canSetTimestamp: boolean
  canEditTimestamp: boolean
  edit: boolean
  onChange: (newValue: Date | null) => void
  timestampLabel: string
  timeStampSetLabel: string
  xs: number
  md?: number
  lg?: number
  xl?: number
  warning?: string
}) => {
  return (
    <>
      {value
        ? (
          <Grid item xs={xs} md={md} lg={lg} xl={xl}>
            <Panel
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <TimestampPicker
                disabled={!edit || !canEditTimestamp}
                label={timestampLabel}
                value={value}
                onChange={newValue => onChange(newValue)}
              />
            </Panel>
          </Grid>
        )
        : (
          (canSetTimestamp) && (
            <Grid
              item
              xs={xs}
              md={md}
              lg={lg}
              xl={xl}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Panel
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100px',
                }}
              >
                <Box>
                  <Button variant='contained' color='primary' disabled={!edit} onClick={() => onChange(new Date())}>
                    {timeStampSetLabel}
                  </Button>
                </Box>
                {warning && (
                  <Box
                    sx={{
                      paddingLeft: '14px',
                    }}
                  >
                    <Typography variant='caption' sx={{ color: 'error.main' }}>
                      {warning}
                    </Typography>
                  </Box>
                )}
              </Panel>
            </Grid>
          )
        )}
    </>
  )
}

export default TimestampSelector
