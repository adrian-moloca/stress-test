import { tRenderer } from '../types'
import { useFieldLogic } from './hooks'
import React from 'react'
import { Box, TextField, Tooltip } from '@mui/material'
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers'
import { format } from 'date-fns'
import { format as formatTz } from 'date-fns-tz'

export const RenderDateType: tRenderer<'date'> = inputProps => {
  const { value, fieldRepresentation, locale, update, path } = inputProps
  const { componentData, setComponentData } = useFieldLogic({
    data: value,
    fieldRepresentation,
    update,
    path
  })
  const getFormattedDate = (date: string) => {
    if (!date) return null
    if (fieldRepresentation.viewAs.timezone)
      return formatTz(
        new Date(date),
        fieldRepresentation.viewAs.format,
        { timeZone: fieldRepresentation.viewAs.timezone }
      )

    return format(new Date(date), fieldRepresentation.viewAs.format)
  }

  const isDateTimeFormat = /[Hms]/.test(fieldRepresentation.viewAs.format)
  const PickerComponent = isDateTimeFormat ? DateTimePicker : DatePicker

  return <Tooltip title={fieldRepresentation.description[locale]}>
    <PickerComponent
      inputFormat={fieldRepresentation.viewAs.format}
      onChange={event => {
        setComponentData(event ? event.toISOString() : null)
      }}
      disabled={!fieldRepresentation.override}
      readOnly={!fieldRepresentation.override}
      value={componentData ? new Date(componentData) : null}
      renderInput={({ inputRef, inputProps, InputProps }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...(inputProps as any)}
            inputRef={inputRef}
            value={getFormattedDate(componentData)}
            required={fieldRepresentation.required}
            fullWidth
            color='primary'
          />
          {InputProps?.endAdornment}
        </Box>
      )}
    />
  </Tooltip>
}
