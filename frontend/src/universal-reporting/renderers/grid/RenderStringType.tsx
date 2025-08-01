import { Tooltip, TextField } from '@mui/material'
import React from 'react'
import { useFieldLogic } from './hooks'
import { tRenderer } from '../types'

export const RenderStringType: tRenderer<'string'> = inputProps => {
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
      error={!!error}
      onChange={event => {
        setComponentData(event.target.value)
      }} />
  </Tooltip>
}
