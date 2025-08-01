import React from 'react'
import { RenderTextWithPatternType } from './RenderTextWithPatternType'
import { tRenderer } from '../types'
import { uniqueIdRegEx } from '@smambu/lib.constants'

export const RenderUniqueIdType: tRenderer<'uniqueId'> = inputProps => {
  const { fields, value, fieldRepresentation, wholePayload, locale, update, path } = inputProps

  return <RenderTextWithPatternType
    fields={fields}
    value={value}
    fieldRepresentation={{ ...fieldRepresentation, viewAs: { ...fieldRepresentation.viewAs, representationKind: 'textWithPattern', format: uniqueIdRegEx } }}
    wholePayload={wholePayload}
    locale={locale}
    editable={fieldRepresentation.override}
    update={update}
    path={path}
  />
}
