import React from 'react'
import { RenderColumnDateType } from './DateColumn'
import { ColumnRenderer } from 'universal-reporting/renderers/types'

export const RenderDateWithoutTimestampType: ColumnRenderer<
  'dateWithoutTimestamp'
> = inputProps => {
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
    <RenderColumnDateType
      field={field}
      fieldRepresentation={{
        ...fieldRepresentation,
        viewAs: { ...fieldRepresentation.viewAs, representationKind: 'date' },
      }}
      fieldDef={fieldDef}
      params={params}
      wholePayload={wholePayload}
      locale={locale}
      editable={editable}
      update={update}
      path={path}
    />
  )
}
