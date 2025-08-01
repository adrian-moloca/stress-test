import React from 'react'
import { RenderPriceType } from 'universal-reporting/renderers/grid/RenderPriceType'
import { ColumnRenderer } from 'universal-reporting/renderers/types'

export const RenderColumnPriceType: ColumnRenderer<'price'> = inputProps => {
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
    <RenderPriceType
      fields={[fieldDef]}
      value={field}
      fieldRepresentation={
        { ...fieldRepresentation, margin: 0, span: 12 } as any
      } // TODO: is it possible to avoid this cast?
      update={update}
      wholePayload={wholePayload}
      editable={editable}
      locale={locale}
      path={path}
    />
  )
}
