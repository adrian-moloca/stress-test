import React from 'react'
import { tRenderer } from '../types'
import { RenderDateType } from './RenderDateType'

export const RenderTimestampType: tRenderer<'timestamp'> = inputProps => {
  const {
    fields, value, fieldRepresentation, wholePayload, locale, editable, update, path
  } = inputProps
  return <RenderDateType
    fields={fields}
    value={value}
    fieldRepresentation={{ ...fieldRepresentation, viewAs: { ...fieldRepresentation.viewAs, representationKind: 'date' } }}
    wholePayload={wholePayload}
    locale={locale}
    editable={editable}
    update={update}
    path={path}
  />
}
