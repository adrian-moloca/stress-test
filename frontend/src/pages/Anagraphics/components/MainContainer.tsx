import { PageContainer, Space10 } from 'components/Commons'
import { FlexDataTable } from 'components/FlexCommons'
import ForbiddenPage from 'pages/Forbidden'
import React, { useState } from 'react'
import { getLanguage, trlb } from 'utilities'
import { useAnagraphicsContext } from './AnagraphicContext'
import CustomToolbar from './CustomToolbar'
import DataCellSelector, { DeleteCell } from './DataGridCells'
import TabsBar from './TabsBar'
import TopBar from './TopBar'
import VersionBar from './VersionBar'
import { IAnagraphicField, IAnagraphicRow, IAnagraphicSetup, TranslatorLanguage, dateString, tDynamicAnagraphicSetup, tFullAnagraphicSetup } from '@smambu/lib.constants'
import { format, isValid } from 'date-fns'
import { Box, Card } from '@mui/material'

export const getHeaderName = (field: IAnagraphicField, language: TranslatorLanguage) => {
  const required = field.required ? '*' : ''
  if (field.labels)
    return `${field.labels[language]}${required}`

  return `${trlb(`anagraphics_${field.name}_name`)}${required}`
}

export const getAnagraphicTypeLabel = (
  anagraphicSetup: IAnagraphicSetup | tFullAnagraphicSetup,
  language: TranslatorLanguage
) => {
  if ((anagraphicSetup as tDynamicAnagraphicSetup).typeLabels)
    return (anagraphicSetup as tDynamicAnagraphicSetup).typeLabels[language]

  return trlb(`anagraphics_${anagraphicSetup.anagraphicType}_title`)
}

export const getSubTypeLabel = (
  anagraphicSetup: IAnagraphicSetup | tFullAnagraphicSetup,
  subType: string,
  language: TranslatorLanguage
) => {
  if ((anagraphicSetup as tDynamicAnagraphicSetup).subTypeLabels)
    return (anagraphicSetup as tDynamicAnagraphicSetup).subTypeLabels![subType][language]

  return trlb(`anagraphics_${subType}_tab`)
}

const MainContainer = () => {
  const [disableSave, setSaveDisabled] = useState(false)
  const language = getLanguage()

  const {
    userPermissions,
    anagraphicSetup,
    form,
    searchText,
    lowHeightScreen,
    edit,
    onEdit,
    deleteNewLine,
    version,
    page,
    setPage,
    rowCount,
    setRowCount,
    pageSize,
    rowsWithDuplicateKeys,
    fieldKeys,
  } = useAnagraphicsContext()

  const dataGridColumn = React.useMemo(() => {
    if (anagraphicSetup.fields == null) return []

    return [
      ...(edit
        ? [
          {
            field: 'delete',
            headerName: '',
            width: 50,
            filterable: false,
            sortable: false,
            renderCell: (params: any) => {
              const isNewRow = version!.new || params.row.id >= version!.rows.length
              return (
                <DeleteCell
                  edit={edit}
                  rowKey={params.row.key}
                  deleteNewLine={deleteNewLine}
                  isNewRow={isNewRow}
                />
              )
            },
            disableExport: true,
          },
        ]
        : []),
      ...(anagraphicSetup.fields.map(field => ({
        field: field.name,
        headerName: getHeaderName(field, language),
        flex: 1, // TODO: manage width
        minWidth: 100,
        filterable: false,
        type: field.type,
        align: 'left',
        renderCell: (params: any) => (
          <DataCellSelector
            field={field}
            params={params}
            form={form}
            edit={edit}
            onEdit={onEdit}
            disableSave={setSaveDisabled}
            disabled={!!field.disabled}
            rowsWithDuplicateKeys={rowsWithDuplicateKeys}
            fieldKeys={fieldKeys}
          />
        ),
        valueFormatter: (params: any) => {
          if (field.type === 'boolean') return params?.value ? 1 : 0
          if (field.type === 'date')
            return isValid(new Date(params?.value))
              ? format(new Date(params.value), dateString)
              : params?.value
          return params?.value
        },
        disableExport: field.noExport,
      })) ?? []),
    ]
  }, [
    anagraphicSetup.fields,
    edit,
    form,
    onEdit,
    setSaveDisabled,
    version,
    deleteNewLine,
    rowsWithDuplicateKeys
  ])

  const fieldsByName = React.useMemo(
    () =>
      (anagraphicSetup.fields ?? []).reduce(
        (acc, field) => ({ ...acc, [field.name]: field }),
        {} as Record<string, IAnagraphicField>,
      ),
    [anagraphicSetup.fields],
  )

  const filteredRows = React.useMemo(() => {
    const rows = !searchText
      ? form.values
      : form.values.filter((row: any) => {
        const index = Object.entries(row).findIndex(([key, value]) => {
          if (!value) return false

          switch (fieldsByName[key]?.type) {
            case 'number':
              return String(value).includes(searchText)

            case 'date':
              return (
                isValid(new Date(value as string)) &&
                  format(new Date(value as string), trlb('dateTime_date_string')).includes(searchText)
              )

            case 'address':
              return Object.values(value).findIndex((v: any) => String(v).toLowerCase()
                .includes(searchText)) !== -1

            case 'string':
            default:
              return String(value).toLowerCase()
                .includes(searchText)
          }
        })

        return index !== -1
      }) ?? []

    return rows
  }, [searchText, form.values, fieldsByName])

  React.useEffect(() => {
    setRowCount(filteredRows.length)
  }, [filteredRows, setRowCount])

  if (!userPermissions.view) return <ForbiddenPage />

  return (
    <PageContainer sx={{ flex: 1, p: lowHeightScreen ? 1 : 4 }}>
      <TopBar disableSave={disableSave} />
      <VersionBar />
      <Space10 />
      {anagraphicSetup.subTypes
        ? (
          <Card>
            <TabsBar />
            <Space10 />
            <Box>
              <FlexDataTable
                showToolbar
                components={{ Toolbar: CustomToolbar }}
                columns={dataGridColumn}
                rowHeight={lowHeightScreen ? 50 : 60}
                getRowId={(row: IAnagraphicRow) => row.key}
                rows={filteredRows}
                disableColumnMenu
                disableSelectionOnClick
                page={page}
                onPageChange={setPage}
                pageSize={pageSize}
                hideFooter
                rowCount={rowCount}
                autoHeight
                componentsProps={{ toolbar: { filteredRows, dataGridColumn } }}
              />
            </Box>
          </Card>
        )
        : (
          <Box>
            <FlexDataTable
              showToolbar
              components={{ Toolbar: CustomToolbar }}
              columns={dataGridColumn}
              rowHeight={lowHeightScreen ? 50 : 60}
              getRowId={(row: IAnagraphicRow) => row.key}
              rows={filteredRows}
              disableColumnMenu
              disableSelectionOnClick
              page={page}
              onPageChange={setPage}
              pageSize={pageSize}
              hideFooter
              rowCount={rowCount}
              autoHeight
              componentsProps={{ toolbar: { filteredRows, dataGridColumn } }}
            />
          </Box>
        )}
    </PageContainer>
  )
}

export default MainContainer
