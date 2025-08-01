import { TextField, InputAdornment, Tooltip } from '@mui/material'
import { tRenderer } from '../types'
import { useFieldLogic } from './hooks'
import React from 'react'

export const RenderPositivePriceType: tRenderer<'positivePrice'> = inputProps => {
  const { value, fieldRepresentation, locale, update, path } = inputProps
  const { componentData, setComponentData, error } =
    useFieldLogic({ data: value, fieldRepresentation, update, path })
  return <Tooltip title={fieldRepresentation.description[locale]}>
    <TextField
      type='number'
      label={fieldRepresentation.label[locale]}
      sx={{ width: '100%' }}
      required={fieldRepresentation.required}
      value={componentData}
      disabled={!fieldRepresentation.override}
      error={!!error}
      onChange={event => {
        setComponentData(event.target.value)
      }}
      onBlur={event => {
        setComponentData(Math.max(0, parseFloat(event.target.value)))
      }}
      InputProps={{
        startAdornment: <InputAdornment position='start'>{fieldRepresentation.viewAs.currency}</InputAdornment>
      }}
    />
  </Tooltip>
}
