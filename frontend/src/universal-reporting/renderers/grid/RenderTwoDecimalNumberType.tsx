import React from 'react'
import { tRenderer } from '../types'
import { Tooltip, TextField } from '@mui/material'
import { useFieldLogic } from './hooks'

export const RenderTwoDecimalNumberType: tRenderer<'twoDecimalNumber'> = inputProps => {
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
      inputProps={{
        step: '0.01'
      }}
    />
  </Tooltip>
}
