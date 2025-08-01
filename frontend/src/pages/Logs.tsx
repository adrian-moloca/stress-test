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
  Panel,
} from 'components/Commons'
import { trlb } from '../utilities/translator/translator'
import { Component, Level, QueryLogDto } from '@smambu/lib.constants'
import { useGetLogs } from 'hooks/logHooks'
import { isValid, format } from 'date-fns'
import { FlexDataTable } from 'components/FlexCommons'
import { DefaultButton } from 'components/Buttons'

const columns = [
  {
    field: 'createdAt',
    headerName: trlb('audit_trail_timestamp'),
    width: 200,
    valueFormatter: ({ value }: { value: string }) => format(new Date(value), trlb('dateTime_date_time_string')),
    filterable: false,
  },
  {
    field: 'component',
    headerName: trlb('logs_component'),
    width: 200,
    valueFormatter: ({ value }: { value: string }) => trlb(value),
    filterable: false,
  },
  {
    field: 'level',
    headerName: trlb('logs_level'),
    width: 100,
    valueFormatter: ({ value }: { value: string }) => trlb(value),
    filterable: false,
  },
  { field: 'message', headerName: trlb('logs_message'), flex: 1, filterable: false },
]

const defaultPaginationLimit = Number(import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT)

const LogsPage = () => {
  const [search, setSearch] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<Level>()
  const [selectedComponent, setSelectedComponent] = useState<Component>()
  const [dateRange, setDateRange] = useState<[number | null, number | null]>([null, null])
  const [tableData, setTableData] = useState([])

  const getLogs = useGetLogs()

  const componentOptions = Object.entries(Component)
    .map(comp => ({ label: trlb(comp[0]), value: comp[1] }))
  const levelOptions = Object.entries(Level).map(lev => ({ label: trlb(lev[0]), value: lev[1] }))

  const [tableControls, setTableControls] = useState({
    pagination: {
      page: 0,
      pageSize: defaultPaginationLimit,
      rowCount: 33,
      pageCount: 5,
    },
    sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
  })

  useEffect(() => {
    const controller = new AbortController()
    getLogs(
      {
        search,
        component: selectedComponent || undefined,
        level: selectedLevel || undefined,
        from: dateRange[0] ?? undefined,
        to: dateRange[1] ?? undefined,
        page: tableControls.pagination.page,
        limit: tableControls.pagination.pageSize,
        sortBy: tableControls.sorting.sortModel?.[0]?.field as keyof QueryLogDto['sortBy'],
        sortOrder: tableControls.sorting.sortModel?.[0]?.sort as keyof QueryLogDto['sortOrder'],
      },
      controller,
    ).then(res => {
      if (res && res.results) setTableData(res.results)
      else setTableData([])

      const newRowCount = res?.total ?? 0
      const newPageCount = Math.ceil(newRowCount / tableControls.pagination.pageSize)

      setTableControls({
        ...tableControls,
        pagination: {
          ...tableControls.pagination,
          rowCount: newRowCount,
          pageCount: newPageCount,
        },
      })
    })

    return () => {
      controller.abort()
    }
  }, [
    dateRange[0],
    dateRange[1],
    search,
    selectedComponent,
    selectedLevel,
    tableControls.pagination.page,
    tableControls.pagination.pageSize,
    tableControls.sorting.sortModel?.[0]?.field,
    tableControls.sorting.sortModel?.[0]?.sort,
  ])

  const handleChangeSearch = (value: string) => {
    setSearch(value)
  }

  const handleChangeDateRange = (newValue: [Date, Date]) => {
    if (isValid(newValue[0]) && isValid(newValue[1]))
      setDateRange([newValue[0].getTime(), newValue[1].getTime()])
    else setDateRange([null, null])
  }

  const handleChangeComponent = (value: Component) => {
    setSelectedComponent(value)
  }

  const handleChangeLevel = (value: Level) => {
    setSelectedLevel(value)
  }

  return (
    <PageContainer>
      <PageHeader pageTitle='Logs' />
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
              text={trlb('commons_clear_filters')}
              onClick={() => {
                setSearch('')
                setDateRange([null, null])
                setSelectedComponent(undefined)
                setSelectedLevel(undefined)
              }}
              disabled={!search &&
                !dateRange[0] &&
                !dateRange[1] &&
                !selectedComponent &&
                !selectedLevel}
              variant='text'
            />
          </Grid>
          <Space20 />
          <GridDateRangeSelector
            xs={4}
            value={dateRange[0] && dateRange[1]
              ? [new Date(dateRange[0]), new Date(dateRange[1])]
              : [null, null]}
            onChange={handleChangeDateRange}
          />
          <GridSelect
            xs={4}
            name={trlb('logs_component')}
            label={trlb('logs_component')}
            menuItems={componentOptions}
            value={selectedComponent ?? ''}
            onChange={e => handleChangeComponent(e.target.value as Component)}
          />
          <GridSelect
            xs={4}
            name={trlb('logs_level')}
            label={trlb('logs_level')}
            menuItems={levelOptions}
            value={selectedLevel ?? ''}
            onChange={e => handleChangeLevel(e.target.value as Level)}
          />
        </Grid>
      </Panel>
      <Space20 />
      <FlexDataTable
        columns={columns}
        rows={tableData}
        autoHeight
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
            },
          })
        }}
      />
    </PageContainer>
  )
}

export default LogsPage
