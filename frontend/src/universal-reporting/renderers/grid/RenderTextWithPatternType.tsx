import React from 'react'
import { Tooltip, TextField } from '@mui/material'
import { tRenderer } from '../types'
import { useFieldLogic } from './hooks'

export const RenderTextWithPatternType: tRenderer<'textWithPattern'> = inputProps => {
  const { value, fieldRepresentation, locale, update, path } = inputProps
  const { componentData, setComponentData, error } =
    useFieldLogic({ data: value, fieldRepresentation, update, path })
  const regex: RegExp = fieldRepresentation.viewAs.format
  const isValidFormat = regex.test(componentData)

  return <Tooltip title={fieldRepresentation.description[locale]}>
    <TextField
      label={fieldRepresentation.label[locale]}
      sx={{ width: '100%' }}
      required={fieldRepresentation.required}
      disabled={!fieldRepresentation.override}
      value={componentData}
      error={!!error || !isValidFormat}
      onChange={event => {
        setComponentData(event.target.value)
      }}
      inputProps={{
        pattern: fieldRepresentation.viewAs.format
      }} />
  </Tooltip>
}
