import React from 'react'
import { ColumnRenderer } from 'universal-reporting/renderers/types'
import { RenderBooleanType } from 'universal-reporting/renderers/grid/RenderBooleanType'

export const RenderColumnBooleanType: ColumnRenderer<'boolean'> = inputProps => {
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

  return <RenderBooleanType
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
