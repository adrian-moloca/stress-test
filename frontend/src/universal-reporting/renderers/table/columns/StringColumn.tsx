import React from 'react'
import { ColumnRenderer } from 'universal-reporting/renderers/types'
import { RenderStringType } from 'universal-reporting/renderers/grid/RenderStringType'

export const RenderColumnStringType: ColumnRenderer<'string'> = inputProps => {
  const {
    field,
    fieldRepresentation,
    fieldDef,
    path,
    locale,
    editable,
    wholePayload,
    update,
  } = inputProps
  return (
    <RenderStringType
      fields={[fieldDef]}
      value={field}
      fieldRepresentation={{ ...fieldRepresentation, margin: 0, span: 12 } as any} // TODO: is it possible to avoid this cast?
      path={path}
      locale={locale}
      editable={editable}
      wholePayload={wholePayload}
      update={update}
    />
  )
}
