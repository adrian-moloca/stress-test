import React from 'react'
import { Grid } from '@mui/material'
import { gridRenderers } from './renderers/grid/gridRendererMap'
import { tField, tSupportedLocales } from '@smambu/lib.constants'
import {
  isEvaluatedContainerRepresentation,
  isEvaluatedFieldRepresentation,
} from './renderers/utils/utils'
import {
  tEvaluatedContainerRepresentation,
  tEvaluatedField,
  tEvaluatedFieldRepresentation,
  tEvaluatedViewItem,
} from './types/tEvaluatedTypes'

/**
 * @description Renders either a field or container representation based on the input type.
 */
export const TViewItemRenderer = ({
  viewItem,
  index,
  fields,
  data,
  setData,
  wholePayload,
  locale,
  editable,
  path,
}: {
  viewItem: tEvaluatedViewItem
  index: number
  fields: tEvaluatedField[]
  data: Record<string, any>
  setData: (data: { path: string; value: any }) => void
  wholePayload: Record<string, any>
  locale: tSupportedLocales
  editable: boolean
  path: string
}) => {
  if (isEvaluatedFieldRepresentation(viewItem))
    return (
      <DynamicField
        inputFields={fields}
        inputRepresentation={viewItem}
        data={data}
        update={setData}
        wholePayload={wholePayload}
        locale={locale}
        editable={editable}
        path={path ? path + '.' + viewItem.fieldId : viewItem.fieldId}
      />
    )
  if (isEvaluatedContainerRepresentation(viewItem))
    return (
      <DynamicContainer
        wholePayload={wholePayload}
        data={data}
        inputFields={[]}
        inputRepresentation={viewItem}
        update={setData}
        editable={editable}
        locale={locale}
        path={path} // TODO: path
      />
    )

  throw new Error('Unknown item type')
}

type tDynamicRendererInput = {
  wholePayload: Record<string, any>
  data: Record<string, any>
  setData: (data: { path: string; value: any }) => void
  fields: tEvaluatedField[]
  representation: tEvaluatedViewItem[]
  editable: boolean
  locale: tSupportedLocales
  path: string
}

/**
 * @description call the ViewItemRenderer for each viewItem.
 */
export const DynamicRendererInner = ({
  wholePayload,
  data,
  setData,
  fields,
  representation,
  editable,
  locale,
  path,
}: tDynamicRendererInput) => {
  return (
    <Grid container
      spacing={1}>
      {representation.map((item, index) => {
        return (
          <TViewItemRenderer
            key={`${item}-${index}`}
            viewItem={item}
            index={index}
            fields={fields}
            data={data}
            setData={setData}
            wholePayload={wholePayload}
            locale={locale}
            editable={editable}
            path={path}
          />
        )
      })}
    </Grid>
  )
}

const retrieveValueFromPath = (path: string, data: Record<string, any>) => {
  const keys = path.split('.')
  const key = keys.shift()
  if (!key || data === undefined) return data
  return retrieveValueFromPath(keys.join('.'), data[key])
}

const retrieveItemValue = (
  path: string,
  curr: Record<string, any>,
  payload: Record<string, any>
) => {
  const isAbsolutePath: boolean = path.startsWith('/')
  if (isAbsolutePath) return retrieveValueFromPath(path.slice(1), payload)

  return retrieveValueFromPath(path, payload)
}

type tDynamicRenderFieldInput = {
  wholePayload: Record<string, any>
  data: Record<string, any>
  inputFields: tEvaluatedField[]
  inputRepresentation: tEvaluatedFieldRepresentation
  update: (data: { path: string; value: any }) => void
  editable: boolean
  locale: tSupportedLocales
  path: string
}

/**
 * @description Renders a field.
 */
export const DynamicField = ({
  inputFields,
  inputRepresentation,
  data,
  update,
  wholePayload,
  locale,
  editable,
  path,
}: tDynamicRenderFieldInput) => {
  const Renderer = gridRenderers[inputRepresentation.viewAs.representationKind]
  return (
    <>
      <Grid item
        xs={inputRepresentation.span}>
        {inputRepresentation.hide === false &&
        (<Renderer
          fields={inputFields}
          value={retrieveItemValue(path, data, wholePayload)}
          fieldRepresentation={inputRepresentation as any} // TODO: is there a way to avoid this cast? probably the reason is that the type is defined as tEvaluatedFieldRepresentation & { viewAs: Extract<tViewAs, { representationKind: K }> } in tRendererProps<K extends tEvaluatedFieldRepresentation['viewAs']['representationKind']>
          wholePayload={wholePayload}
          locale={locale}
          editable={editable}
          update={update}
          path={path}
        />)
        }
      </Grid>
      {/* TODO: i prefer the data to be correct, so the sum of span and margin is 12 at max, but can be a check. */}
      {/* {Math.min(12 - inputRepresentation.span, inputRepresentation.margin) > 0 && */}
      {inputRepresentation.margin > 0 && <Grid item
        xs={inputRepresentation.margin}></Grid>}
    </>
  )
}

type tDynamicRenderContainerInput = {
  wholePayload: Record<string, any>
  data: Record<string, any>
  inputFields: tField[]
  inputRepresentation: tEvaluatedContainerRepresentation
  update: (data: { path: string; value: any }) => void
  editable: boolean
  locale: tSupportedLocales
  path: string
}

const DynamicContainer = ({
  inputFields,
  inputRepresentation,
  data,
  update,
  wholePayload,
  locale,
  editable,
  path,
}: tDynamicRenderContainerInput) => {
  throw new Error('DynamicContainer probably will be deprecated!')
}
