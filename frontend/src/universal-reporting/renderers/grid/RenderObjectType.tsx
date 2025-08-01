import React from 'react'
import { DynamicRendererInner } from '../../DynamicRendererInner'
import { tRenderer } from '../types'

export const RenderObjectType: tRenderer<'object'> = inputProps => {
  const {
    fields,
    value,
    fieldRepresentation,
    wholePayload,
    locale,
    editable,
    update,
    path
  } = inputProps

  return <DynamicRendererInner
    wholePayload={wholePayload}
    fields={fields}
    representation={fieldRepresentation.viewAs.subFields}
    data={value}
    setData={(input: { path: string; value: any; }) => {
      update(input)
    }}
    locale={locale}
    editable={editable}
    path={path} />
}
