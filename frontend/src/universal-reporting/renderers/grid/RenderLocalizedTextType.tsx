import React from 'react'
import { tRenderer } from '../types'
import { RenderStringType } from './RenderStringType'
import { trlb } from 'utilities'

export const RenderLocalizedTextType: tRenderer<'localizedText'> = inputProps => {
  return <RenderStringType
    fields={inputProps.fields}
    value={trlb(inputProps.value)}
    fieldRepresentation={{ ...inputProps.fieldRepresentation, viewAs: { ...inputProps.fieldRepresentation.viewAs, representationKind: 'string' } }}
    wholePayload={inputProps.wholePayload}
    locale={inputProps.locale}
    editable={inputProps.editable}
    update={inputProps.update}
    path={inputProps.path}
  />
}
