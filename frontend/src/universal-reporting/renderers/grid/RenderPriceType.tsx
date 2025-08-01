import { Tooltip, TextField, InputAdornment } from '@mui/material'
import { tRenderer } from '../types'
import { useFieldLogic } from './hooks'
import React from 'react'
export const RenderPriceType: tRenderer<'price'> = inputProps => {
  const { value, fieldRepresentation, locale, update, path } = inputProps
  const { componentData, setComponentData, error } =
    useFieldLogic({ data: value, fieldRepresentation, update, path })

  return <Tooltip title={fieldRepresentation.description[locale]}>
    <TextField
      label={fieldRepresentation.label[locale]}
      sx={{ width: '100%' }}
      required={fieldRepresentation.required}
      disabled={!fieldRepresentation.override}
      value={componentData}
      type='number'
      error={!!error}
      onChange={event => {
        setComponentData(event.target.value)
      }}
      InputProps={{
        startAdornment: <InputAdornment position='start'>{fieldRepresentation.viewAs.currency}</InputAdornment>
      }}
    />
  </Tooltip>
}
