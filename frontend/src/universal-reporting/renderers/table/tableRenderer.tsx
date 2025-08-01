import React from 'react'
import { GridColDef, GridCellParams, DataGrid } from '@mui/x-data-grid'
import { columnRenderers } from './tableRendererMap'
import { Tooltip } from '@mui/material'
import { tSupportedLocales } from '@smambu/lib.constants'
import { tEvaluatedColumnRepresentation, tEvaluatedField } from 'universal-reporting/types/tEvaluatedTypes'

const renderTableField = (
  fieldRepresentation: tEvaluatedColumnRepresentation,
  field: tEvaluatedField,
  locale: tSupportedLocales,
  editable: boolean,
  wholePayload: Record<string, any>,
  update: (data: { path: string, value: any }) => void,
  path: string
): GridColDef => {
  const bar = fieldRepresentation.viewAs.representationKind
  const Renderer = columnRenderers[bar]
  const result: GridColDef = {
    field: fieldRepresentation.fieldId,
    hide: fieldRepresentation.hide,
    editable: false,
    filterable: fieldRepresentation.filterable,
    align: 'center',
    headerAlign: 'center',
    renderHeader: () => (
      <Tooltip title={fieldRepresentation.description[locale]}>
        <span>{fieldRepresentation.label[locale]}</span>
      </Tooltip>
    ),
    renderCell: (params: GridCellParams): React.ReactNode => {
      return <Renderer
        field={params.value}
        fieldRepresentation={fieldRepresentation as any}
        fieldDef={field}
        params={params}
        wholePayload={wholePayload}
        locale={locale}
        editable={editable}
        update={data => {
          update({ path: `${data.path}.${fieldRepresentation.fieldId}`, value: data.value })
        }}
        path={`${path}.${params.row.index}`}
      />
    },
    ...fieldRepresentation.span,
  }
  return result
}

  type FieldTypeMap = {
    fields: tEvaluatedField[];
    columnRepresentations: tEvaluatedColumnRepresentation[];
    data: { [key: string]: any }[];
    editable: boolean;
    locale: tSupportedLocales;
    wholePayload: Record<string, any>;
    update: (data: { path: string, value: any }) => void;
    path: string;
    rowId: string;
  };

export const TableRender = (input: FieldTypeMap) => {
  const {
    fields,
    columnRepresentations,
    data,
    update,
    editable,
    locale,
    wholePayload,
    path,
    rowId
  } = input

  const columns = React.useMemo(() => columnRepresentations.map(column =>
    renderTableField(column,
      fields.find(field => {
        return field.id === column.fieldId
      }) as tEvaluatedField,
      locale,
      editable,
      wholePayload,
      update,
      path))
  , [columnRepresentations, fields, locale, editable, wholePayload, update, path])

  const rows = React.useMemo(() => (data || []).map((row, index) => ({
    ...row, index
  })), [data])

  return (
    <DataGrid
      autoHeight={true}
      rows={rows}
      getRowId={row => row[rowId]}
      columns={columns}
    />
  )
}
