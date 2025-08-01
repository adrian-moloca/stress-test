import React from 'react'
import { Box, IconButton, TextField } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { addMinutes } from 'date-fns'
import { ampmEnabled } from '@smambu/lib.constants'
import { trlb } from 'utilities'

const TimestampPicker = ({
  value,
  onChange,
  label,
  disabled,
}: {
  value: Date | null
  onChange: (newValue: Date | null) => void
  label: string
  disabled: boolean
}) => {
  return (
    <Box display={'flex'} alignItems={'center'}>
      <DateTimePicker
        ampm={ampmEnabled}
        inputFormat={trlb('dateTime_date_time_string')}
        disabled={disabled}
        label={label}
        value={value ?? null}
        onChange={onChange}
        renderInput={props => <TextField {...props} />}
      />
      <Box
        display={'flex'}
        flexDirection={'column'}
        sx={{
          marginLeft: '10px',
        }}
      >
        <IconButton
          sx={{
            height: '30px',
            width: '30px',
          }}
          onClick={() => onChange(addMinutes(new Date(value), 1))}
          disabled={disabled}
        >
          <ArrowDropUpIcon
            style={{
              fontSize: '30px',
            }}
          />
        </IconButton>
        <IconButton
          sx={{
            height: '30px',
            width: '30px',
          }}
          onClick={() => onChange(addMinutes(new Date(value), -1))}
          disabled={disabled}
        >
          <ArrowDropDownIcon
            style={{
              fontSize: '30px',
            }}
          />
        </IconButton>
      </Box>
    </Box>
  )
}

export default TimestampPicker
