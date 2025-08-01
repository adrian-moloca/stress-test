import React from 'react'
import { RenderTextWithPatternType } from 'universal-reporting/renderers/grid/RenderTextWithPatternType'
import { ColumnRenderer } from 'universal-reporting/renderers/types'

export const RenderColumnTextWithPatternType: ColumnRenderer<'textWithPattern'> = inputProps => {
  const {
    field,
    fieldRepresentation,
    fieldDef,
    path,
    locale,
    editable,
    wholePayload,
    update
  } = inputProps
  return <RenderTextWithPatternType
    fields={[fieldDef]}
    value={field}
    fieldRepresentation={{ ...fieldRepresentation, margin: 0, span: 12 } as any} // TODO: is it possible to avoid this cast?
    update={update}
    wholePayload={wholePayload}
    editable={editable}
    locale={locale}
    path={path}
  />
}
