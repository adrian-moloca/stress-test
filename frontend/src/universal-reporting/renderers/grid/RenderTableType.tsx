import React from 'react'
import { tRenderer } from '../types'
import { TableRender } from '../table/tableRenderer'

export const RenderTableType: tRenderer<'table'> = inputProps => {
  const {
    fields,
    fieldRepresentation,
    value,
    locale,
    wholePayload,
    path,
    update,
    editable,
  } = inputProps
  return (
    <TableRender
      fields={fields}
      columnRepresentations={fieldRepresentation.viewAs.columns}
      rowId={fieldRepresentation.viewAs.rowId}
      data={value}
      locale={locale}
      update={update}
      wholePayload={wholePayload}
      path={path}
      editable={editable && fieldRepresentation.override}
    />
  )
}
