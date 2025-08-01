import React from 'react'
import { RenderColumnTextWithPatternType } from './TextWithPatternColumn'
import { ColumnRenderer } from 'universal-reporting/renderers/types'
import { emailRegEx } from '@smambu/lib.constants'

export const RenderEmailType: ColumnRenderer<'email'> = inputProps => {
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
    <RenderColumnTextWithPatternType
      field={field}
      fieldDef={fieldDef}
      fieldRepresentation={{
        ...fieldRepresentation,
        viewAs: {
          ...fieldRepresentation.viewAs,
          representationKind: 'textWithPattern',
          format: emailRegEx,
        },
      }}
      update={update}
      wholePayload={wholePayload}
      locale={locale}
      path={path}
      editable={editable}
      params={params}
    />
  )
}
