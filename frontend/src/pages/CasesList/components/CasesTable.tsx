import { CaseStatus, ILimitedCase, casesListColumns, permissionRequests } from '@smambu/lib.constants'
import { GridRenderCellParams, GridRowParams, getGridStringOperators } from '@mui/x-data-grid'
import { FlexDataTable } from 'components/FlexCommons'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import StandardToolbar from './CustomToolbar'
import { routes } from 'routes/routes'
import { trlb } from 'utilities'
import { useAppSelector } from 'store'
import { compareAsc, isValid, parse } from 'date-fns'
import { Box, IconButton } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import EditIcon from '@mui/icons-material/Edit'
import { WarningIcon } from 'components/Icons'
import { getMuiDataGridData } from 'utilities/misc'

interface ICasesTableProps {
  cases: { [caseId: string]: ILimitedCase }
  selectable?: boolean
  selectModel?: string[]
  setSelectModel?: (value: string[]) => void
  CustomToolbar?: any
  toolbarProps?: any
  additionalColumnns?: any[]
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
  onSortModelChange: (sortModel: any) => void
  sortModel: any
  total: number
  keepNonExistentRowsSelected?: boolean
  getCSVDataFun: () => Promise<ILimitedCase[]>
}

const filterOperators = getGridStringOperators().filter(operator => operator.value === 'contains')

const dataNotAvailable = trlb('cases_dataNotAvailable')
const dateString = trlb('dateTime_date_string')

const CasesTable: React.FC<ICasesTableProps> = ({
  cases,
  selectable = false,
  selectModel,
  setSelectModel,
  CustomToolbar,
  toolbarProps,
  additionalColumnns = [],
  currentPage,
  limit,
  onPageChange,
  onPageSizeChange,
  onSortModelChange,
  sortModel,
  total,
  keepNonExistentRowsSelected,
  getCSVDataFun
}) => {
  const checkPermission = useGetCheckPermission()
  const navigate = useNavigate()
  const contracts = useAppSelector(state => state.contracts)

  const canViewAllCasesListColumns = checkPermission(permissionRequests.canViewAllCasesListColumns)

  const refColumns = [...Object.values(casesListColumns), ...additionalColumnns]

  const columns = [
    ...refColumns
      .filter(column => canViewAllCasesListColumns ||
        !column.vPermission ||
        checkPermission(column.vPermission))
      .map(column => {
        if (column.type === 'special') return column

        return {
          field: column.field,
          headerName: trlb(`cases_${column.field}`),
          width: column.width ?? 120,
          filterOperators,
          index: column.index,
          type: column.type,
          ...(column.type === 'date' && {
            sortComparator: (_v1: any, _v2: any, cellParams1: any, cellParams2: any) => {
              const date1 = isValid(cellParams1.value)
                ? cellParams1.value
                : parse(cellParams1.value, dateString, new Date())
              const date2 = isValid(cellParams2.value)
                ? cellParams2.value
                : parse(cellParams2.value, dateString, new Date())
              return compareAsc(date1, date2)
            },
          }),
        }
      }),
    {
      index: 14,
      field: 'incompleteWarning',
      vPermission: permissionRequests.canViewCasesBilling,
      oPermission: permissionRequests.canViewCaseBilling,
      sortable: false,
      filterable: false,
      headerName: '',
      width: 20,
      renderCell: (params: GridRenderCellParams) => {
        const caseItem = cases[params.row.caseId]
        const canViewCaseBilling = checkPermission(permissionRequests.canViewCaseBilling, {
          caseItem,
        })

        if (!canViewCaseBilling) return <></>

        const isMissingInfo = caseItem!.status === CaseStatus.INFORMATION_INCOMPLETE

        return isMissingInfo ? <WarningIcon /> : null
      },
      type: 'special',
    },
    {
      index: 19,
      field: 'info',
      headerName: '',
      width: 50,
      filterOperators,
      type: 'special',
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: (params: GridRenderCellParams) => {
        const canViewCase = checkPermission(permissionRequests.canViewCase, {
          caseItem: cases[params.row.caseId],
        })
        return canViewCase
          ? (
            <IconButton onClick={() => {}}>
              <InfoIcon />
            </IconButton>
          )
          : (
            <></>
          )
      },
    },
    {
      index: 20,
      field: 'edit',
      headerName: '',
      width: 50,
      filterOperators,
      type: 'special',
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: (params: GridRenderCellParams) => {
        const canEditCase = checkPermission(permissionRequests.canEditCase, {
          caseItem: cases[params.row.caseId],
        })
        return canEditCase
          ? (
            <IconButton
              onClick={e => {
                e.stopPropagation()
                navigate(routes.caseEdit.replace(':caseId', params.row.caseId))
              }}
            >
              <EditIcon />
            </IconButton>
          )
          : (
            <></>
          )
      },
    },
  ].sort((a, b) => a.index - b.index)

  const formatCaseItem = (caseItem: ILimitedCase) => {
    let value = refColumns.reduce((acc, column) => {
      const translatedFallback = column.translated
        ? trlb(String(caseItem[column.field as keyof ILimitedCase]))
        : caseItem[column.field as keyof ILimitedCase] ?? ''

      const value = column.valueGetter?.(caseItem, { dateString, contracts }) ?? translatedFallback

      acc[column.field] =
        value &&
          column.oPermission &&
          !checkPermission(column.oPermission, { caseItem, doctor: caseItem?.associatedDoctor! })
          ? dataNotAvailable
          : value

      return acc
    }, {} as Record<string, any>)

    value.caseId = caseItem.caseId

    return value
  }

  const onRowClick = (params: GridRenderCellParams) => {
    const canViewCase = checkPermission(permissionRequests.canViewCase, {
      caseItem: cases[params.row.caseId],
    })
    if (!canViewCase) return
    navigate(`${routes.cases}/${params.id}`)
  }

  const rows = Object.values(cases).map(formatCaseItem)

  type tCellData = string | number | Date | boolean | undefined

  const computeCSVData = async (): Promise<tCellData[][]> => {
    const csvData = await getCSVDataFun()
    const csvRows = csvData.map(formatCaseItem)
    const res = getMuiDataGridData(columns, csvRows)

    return res
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: 1 }}>
      <FlexDataTable
        rows={rows}
        columns={columns}
        components={{ Toolbar: CustomToolbar ?? StandardToolbar }}
        componentsProps={{
          toolbar: { ...toolbarProps, columns, rows, getData: computeCSVData },
        }}
        getRowId={(row: any) => row.caseId}
        disableSelectionOnClick
        onRowClick={onRowClick}
        getRowClassName={(params: GridRowParams) => {
          const canViewCase = checkPermission(permissionRequests.canViewCase, {
            caseItem: cases[params.row.caseId],
          })
          return canViewCase ? '' : 'greyRow'
        }}
        onSelectionModelChange={setSelectModel}
        selectionModel={selectModel}
        checkboxSelection={selectable}
        autoHeight
        onPageSizeChange={onPageSizeChange}
        onSortModelChange={onSortModelChange}
        onPageChange={onPageChange}
        pagination
        pageSize={limit}
        rowCount={total}
        paginationMode={'server'}
        sortingMode={'server'}
        page={currentPage}
        sortModel={sortModel}
        keepNonExistentRowsSelected={keepNonExistentRowsSelected}
      />
    </Box>
  )
}

export default CasesTable
