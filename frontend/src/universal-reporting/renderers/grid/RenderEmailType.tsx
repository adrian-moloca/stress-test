import React from 'react'
import { RenderTextWithPatternType } from './RenderTextWithPatternType'
import { tRenderer } from '../types'
import { emailRegEx } from '@smambu/lib.constants'

export const RenderEmailType: tRenderer<'email'> = inputProps => {
  return <RenderTextWithPatternType
    value={inputProps.value}
    fieldRepresentation={{ ...inputProps.fieldRepresentation, viewAs: { ...inputProps.fieldRepresentation.viewAs, representationKind: 'textWithPattern', format: emailRegEx } }}
    fields={[]}
    wholePayload={inputProps.wholePayload}
    locale={inputProps.locale}
    editable={inputProps.editable}
    update={inputProps.update}
    path={inputProps.path} />
}
