import {
  IListColumn,
  Identifier,
  MaterialUsageItem,
  getFullName,
  permissionRequestProps,
  permissionRequests,
} from '@smambu/lib.constants'
import { getGridStringOperators } from '@mui/x-data-grid'
import { trlb } from 'utilities'
import { isValid, compareAsc, parse } from 'date-fns'

export interface IMaterialUsageItemsponse {
  [artikelnummer: Identifier]: MaterialUsageItem
}

const filterOperators = getGridStringOperators().filter(operator => operator.value === 'contains')
const dateString = trlb('dateTime_date_string')

export type IMaterialUsageListColumn = IListColumn<MaterialUsageItem, {}> & {translateKey: string}

export const columnDefs: Record<string, IMaterialUsageListColumn> = {
  doctorName: {
    index: 0,
    field: 'doctor',
    vPermission: permissionRequests.canViewCasesListDoctorColumns,
    oPermission: permissionRequests.canViewCaseDoctor,
    valueGetter: item => getFullName(item.doctor, false),
    type: 'string',
    width: 230,
    translateKey: 'cases_doctorName',
  },
  artikelnummer: {
    index: 2,
    field: 'artikelnummer',
    type: 'string',
    width: 130,
    translateKey: 'anagraphics_artikelnummer_name',
  },
  artikelbezeichnung: {
    index: 3,
    field: 'artikelbezeichnung',
    type: 'string',
    width: 230,
    translateKey: 'anagraphics_artikelbezeichnung_name',
  },
  factor: {
    index: 4,
    field: 'faktor',
    type: 'string',
    translateKey: 'anagraphics_faktor_name',
  },
  amount_used: {
    index: 5,
    field: 'amount_used',
    type: 'string',
    translateKey: 'materials_usage_page_amount_used',
  },
  surplus: {
    index: 6,
    field: 'surplus',
    type: 'string',
    translateKey: 'materials_usage_page_surplus',
  },
  total: {
    index: 7,
    field: 'total',
    type: 'string',
    translateKey: 'materials_usage_page_total',
  },
  billableUnits: {
    index: 8,
    field: 'billableUnits',
    type: 'string',
    translateKey: 'materials_usage_page_billable_units',
  },
  remainingAmount: {
    index: 9,
    field: 'remainingAmount',
    type: 'string',
    translateKey: 'materials_usage_page_remaining_amount',
  },
}

export const getColumns = (
  checkPermission: (permissionRequest?: permissionRequests | undefined,
    props?: permissionRequestProps) => any,
) => {
  const canViewAllCasesListColumns = checkPermission(permissionRequests.canViewAllCasesListColumns)
  return [
    ...Object.values(columnDefs)
      .filter(column => canViewAllCasesListColumns ||
        !column.vPermission ||
        checkPermission(column.vPermission))
      .map(column => {
        if (column.type === 'special') return column

        return {
          field: column.field,
          headerName: trlb(`${column.translateKey}`),
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
  ].sort((a, b) => a.index - b.index)
}
