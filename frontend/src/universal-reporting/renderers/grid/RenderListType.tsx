import React from 'react'
import { isEvaluatedContainerRepresentation, isEvaluatedFieldRepresentation } from '../utils/utils'
import { tRenderer } from '../types'
import { DynamicField } from 'universal-reporting/DynamicRendererInner'

export const RenderListType: tRenderer<'list'> = inputProps => {
  const {
    value,
    fieldRepresentation,
    locale,
    update,
    path,
    fields,
    wholePayload
  } = inputProps

  return (value ?? []).map((item: any, index: number) => {
    let itemData = {}
    if (isEvaluatedFieldRepresentation(fieldRepresentation.viewAs.field))
      itemData = { [fieldRepresentation.viewAs.field.fieldId]: item }
    else if (isEvaluatedContainerRepresentation(fieldRepresentation.viewAs.field))
      itemData = { [fieldRepresentation.fieldId]: item }

    return <DynamicField
      key={`${path}-${index}`}
      data={itemData}
      update={update}
      inputFields={fields}
      inputRepresentation={fieldRepresentation.viewAs.field}
      editable={fieldRepresentation.override}
      locale={locale}
      path={path + '.' + index}
      wholePayload={wholePayload} />
  })
}
