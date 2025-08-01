import React from 'react'
import { ColumnRenderer } from 'universal-reporting/renderers/types'
import { RenderUniqueIdType } from 'universal-reporting/renderers/grid/RenderUniqueIdType'

export const RenderColumnUniqueIdType: ColumnRenderer<'uniqueId'> = inputProps => {
  const {
    field,
    fieldRepresentation,
    fieldDef,
    path,
    locale,
    editable,
    wholePayload,
    update,
    params,
  } = inputProps
  return (
    <RenderUniqueIdType
      fields={[fieldDef]}
      value={field}
      fieldRepresentation={{ ...fieldRepresentation, margin: 0, span: 12 } as any} // TODO: is it possible to avoid this cast?
      update={update}
      wholePayload={wholePayload}
      locale={locale}
      editable={editable}
      path={path}
    />
  )
}
