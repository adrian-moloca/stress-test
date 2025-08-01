import { Tooltip, Checkbox, FormControlLabel } from '@mui/material'
import React from 'react'
import { useFieldLogic } from './hooks'
import { tRenderer } from '../types'

export const RenderBooleanType: tRenderer<'boolean'> = inputProps => {
  const { value, fieldRepresentation, locale, update, path } = inputProps
  const { componentData, setComponentData } = useFieldLogic({
    data: value,
    fieldRepresentation,
    update,
    path
  })

  return <Tooltip title={fieldRepresentation.description[locale]}>
    <FormControlLabel
      control={<Checkbox disabled={!fieldRepresentation.override}
        checked={componentData}
        onChange={event => {
          setComponentData(event.target.checked)
        }} />}
      label={fieldRepresentation.label[locale]}
    />
  </Tooltip>
}
