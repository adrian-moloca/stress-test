import React, { useEffect, useState } from 'react'
import { Grid } from '@mui/material'
import {
  PageContainer,
  PageHeader,
  Space20,
  GridSelect,
  SectionSubtitle,
  GridTextField,
  GridDateRangeSelector,
  GridAutocomplete,
  Panel,
} from 'components/Commons'
import { trlb } from '../utilities/translator/translator'
import { AuditAction, IAuditTrailRow, IUser, QueryAuditTrailDto, getFullName } from '@smambu/lib.constants'
import { useGetUsers } from 'hooks/userHooks'
import { useAppSelector } from 'store'
import { useGetAuditTrails } from 'hooks/logHooks'
import { GridValueFormatterParams } from '@mui/x-data-grid'
import { addDays, addWeeks, endOfDay, format, isBefore, isSameDay, isValid, startOfDay, subDays, subWeeks } from 'date-fns'
import { FlexDataTable } from 'components/FlexCommons'
import { DefaultButton } from 'components/Buttons'

const defaultPaginationLimit = Number(import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT)

const columns = [
  {
    field: 'createdAt',
    headerName: trlb('audit_trail_timestamp'),
    width: 200,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) =>
      format(new Date(value), trlb('dateTime_date_time_string')),
    type: 'dateTime',
    filterable: false,
  },
  { field: 'userId', headerName: trlb('audit_trail_user_database_id'), width: 140, filterable: false },
  { field: 'userName', headerName: trlb('table_field_userName'), width: 140, filterable: false },
  {
    field: 'entityType',
    headerName: trlb('table_field_entityType'),
    width: 100,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) => trlb(value),
    filterable: false,
  },
  { field: 'entityNameOrId', headerName: trlb('table_field_entityName'), width: 260, filterable: false },
  {
    field: 'entityDatabaseId',
    headerName: trlb('table_field_databaseID'),
    width: 120,
    filterable: false,
  },
  { field: 'field', headerName: trlb('table_field_Field'), width: 260, filterable: false },
  {
    field: 'action',
    headerName: trlb('table_field_action'),
    width: 100,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) => trlb(value),
    filterable: false,
  },
  {
    field: 'previousValue',
    headerName: trlb('table_field_previousValue'),
    width: 150,
    filterable: false,
  },
  {
    field: 'newValue',
    headerName: trlb('table_field_newValue'),
    width: 150,
    filterable: false,
  },
]

const getEmptyDates = (): [number, number] =>
  [subWeeks(new Date(), 1).getTime(), new Date().getTime()]

const AuditTrailPage = () => {
  const actions = Object.keys(AuditAction)
  const users = useAppSelector(state => state.users)
  const usersLength = Object.keys(users).length
  const [search, setSearch] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [dateRange, setDateRange] = useState<[number, number]>(getEmptyDates())
  const [tableData, setTableData] = useState<IAuditTrailRow[]>([])
  const [tableControls, setTableControls] = useState({
    pagination: { page: 0, pageSize: defaultPaginationLimit, rowCount: 33, pageCount: 5 },
    sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
  })
  const getUsers = useGetUsers()
  const getAuditTrails = useGetAuditTrails()
  const [error, setError] = useState(false)

  const searchDisabled = error || !isValid(new Date(dateRange[0])) ||
    !isValid(new Date(dateRange[1]))

  useEffect(() => {
    getUsers({})
  }, [])

  useEffect(() => {
    if (usersLength > 0)
      onSearch()
  }, [usersLength, tableControls.pagination.page, tableControls.pagination.pageSize])

  const onSearch = () => {
    const controller = new AbortController()
    getAuditTrails(
      {
        search,
        userId: selectedUser?.id,
        action: !selectedAction ? undefined : (selectedAction as AuditAction),
        from: dateRange[0] ?? undefined,
        to: dateRange[1] ?? undefined,
        page: tableControls.pagination.page,
        limit: tableControls.pagination.pageSize,
        sortBy: tableControls.sorting.sortModel?.[0]?.field as keyof QueryAuditTrailDto['sortBy'],
        sortOrder: tableControls.sorting.sortModel?.[0]?.sort as keyof QueryAuditTrailDto['sortOrder'],
      },
      controller,
    ).then(res => {
      if (res && res.results) {
        setTableData(
          res.results.map((trail: IAuditTrailRow) => {
            const user = users[trail.userId]
            if (user)
              return {
                ...trail,
                userName: getFullName(user, true),
              }
            else
              return {
                ...trail,
                userName: '',
                userId: '',
              }
          }),
        )
        setTableControls({
          ...tableControls,
          pagination: {
            ...tableControls.pagination,
            rowCount: res.total,
            pageCount: Math.ceil(res.total / tableControls.pagination.pageSize),
          },
        })
      } else {
        setTableData([])
      }
    })

    return () => {
      controller.abort()
    }
  }

  const userOptions = [
    { label: '-', value: '' },
    ...Object.values(users).map(user => ({ label: getFullName(user, true), value: user.id })),
  ]

  const handleChangeSearch = (value: string) => {
    setSearch(value)
  }

  const handleChangeUser = (value: string) => {
    if (value === '') setSelectedUser(null)
    setSelectedUser(users[value] ?? null)
  }

  const handleChangeDateRange = ([newStart, newEnd]: [Date | null, Date | null]) => {
    if (newStart == null || newEnd == null ||
      !isValid(newStart) || !isValid(newEnd)) {
      setError(true)
      return
    }

    setError(false)

    const oldStart = new Date(dateRange[0])

    if (isBefore(addWeeks(endOfDay(newStart), 1), newEnd) || isBefore(newEnd, newStart))
      if (isSameDay(newStart, oldStart))
        setDateRange([subDays(startOfDay(newEnd), 6).getTime(), newEnd.getTime()])
      else
        setDateRange([newStart.getTime(), addDays(endOfDay(newStart), 6).getTime()])
    else
      setDateRange([newStart.getTime(), newEnd.getTime()])
  }

  const handleChangeAction = (value: string) => {
    setSelectedAction(value)
  }

  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('title_audit_trail')} />
      <Space20 />
      <Panel>
        <Grid container spacing={2} sx={{ paddingLeft: '16px' }}>
          <SectionSubtitle text={trlb('filter_title')} />
          <Grid container item xs={12} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <GridTextField
              xs={9}
              label={trlb('commons_search')}
              value={search}
              onChange={e => handleChangeSearch(e.target.value)}
              searchIcon
            />
            <DefaultButton
              xs={3}
              variant='contained'
              onClick={onSearch}
              text={trlb('commons_search')}
              disabled={searchDisabled}
            />
            <DefaultButton
              xs={3}
              variant='text'
              onClick={() => {
                setSearch('')
                setSelectedUser(null)
                setSelectedAction('')
                setDateRange(getEmptyDates())
              }}
              disabled={!search &&
                !selectedUser &&
                !selectedAction &&
                !dateRange[0] &&
                !dateRange[1]}
              text={trlb('commons_clear_filters')}
            />
          </Grid>
          <Space20 />
          <GridDateRangeSelector
            xs={4}
            value={dateRange}
            allChanges
            onChange={handleChangeDateRange}
            forceValue
            forceError
          />
          <GridAutocomplete
            xs={4}
            name={trlb('user_filter')}
            label={trlb('user_filter')}
            options={userOptions}
            selected={selectedUser != null ? getFullName(selectedUser, true) : ''}
            onSelectValue={(_e: any, v: any) => handleChangeUser(v?.value as string)}
          />
          <GridSelect
            xs={4}
            name={trlb('action_filter')}
            label={trlb('action_filter')}
            menuItems={[{ value: '', label: '-' }, ...actions.map(el => ({ value: el, label: trlb(el) }))]}
            value={selectedAction}
            onChange={e => handleChangeAction(e.target.value as string)}
          />
        </Grid>
      </Panel>
      <Space20 />
      <FlexDataTable
        rows={tableData}
        columns={columns}
        getRowId={(row: IAuditTrailRow) => row._id}
        pagination
        pageSize={tableControls.pagination.pageSize}
        rowCount={tableControls.pagination.rowCount}
        paginationMode='server'
        page={tableControls.pagination.page}
        onPageChange={(newPage: number) => {
          setTableControls({
            ...tableControls,
            pagination: {
              ...tableControls.pagination,
              page: newPage,
            },
          })
        }}
        sortingMode='server'
        sortingModel={tableControls.sorting.sortModel}
        onSortModelChange={(newModel: any) => {
          setTableControls({
            ...tableControls,
            sorting: {
              ...tableControls.sorting,
              sortModel: newModel,
            },
          })
        }}
        onPageSizeChange={(newPageSize: number) => {
          setTableControls({
            ...tableControls,
            pagination: {
              ...tableControls.pagination,
              pageSize: newPageSize,
              page: 0,
            },
          })
        }}
        autoHeight
      />
    </PageContainer>
  )
}

export default AuditTrailPage
