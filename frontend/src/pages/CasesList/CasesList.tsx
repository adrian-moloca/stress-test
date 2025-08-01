import React from 'react'
import { Box } from '@mui/material'
import { PageContainer, PageHeader, Space10, Space20 } from 'components/Commons'
import { trlb } from 'utilities'
import { useFetchCases, useGetCasesCSV } from 'hooks/caseshooks'
import {
  ILimitedCase,
  casesListTimePeriodOptions,
  casesListTimePeriods,
} from '@smambu/lib.constants'
import { FlexSearchField, FlexSelector } from 'components/FlexCommons'
import MissingFilters from './components/MissingFilters'
import { useParams } from 'react-router-dom'
import CasesTable from './components/CasesTable'
import { GridSortModel } from '@mui/x-data-grid'

const defaultLimit = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT

const CasesListPage = () => {
  const patientId = useParams().patientId
  const [timePeriod, setTimePeriod] = React.useState(casesListTimePeriods.lastMonth.value)

  const [searchText, setSearchText] = React.useState('')
  const [selectedMissingFilters, setSelectedMissingFilters] = React.useState<string[]>([])
  const [missingInfoFilters, setMissingInfoFilters] = React.useState<string[]>([])

  /*
    TODO
    This states should be removed and substituted by the useFetchCases hook
    when implementing the permanent filters
  */
  const [page, setPage] = React.useState(0)
  const [limit, setLimit] = React.useState(defaultLimit)
  const [sortModel, setSortModel] = React.useState<GridSortModel>([])

  const { currentPage, onPageChange, onPageSizeChange, onSortModelChange, cases, total } =
    useFetchCases(
      page,
      setPage,
      limit,
      setLimit,
      sortModel,
      setSortModel,
      searchText,
      casesListTimePeriods?.[timePeriod]?.getValue()?.getTime()
        ?.toString(),
      undefined,
      undefined,
      undefined,
      patientId,
      selectedMissingFilters,
      missingInfoFilters,
    )

  const getExportedData = useGetCasesCSV(
    searchText,
    casesListTimePeriods?.[timePeriod]?.getValue()?.getTime()
      ?.toString(),
    undefined,
    undefined,
    undefined,
    patientId,
    selectedMissingFilters,
    missingInfoFilters
  )

  const casesObject = cases.reduce((acc, current) => {
    acc[current.caseId] = current
    return acc
  }, {} as Record<string, ILimitedCase>)

  // UR TODO: missingOptions should be configured based on JSON file
  const missingOptions = [] as { value: string; label: string }[]

  // UR TODO: missingInfoOptions should be configured based on JSON file
  const missingInfoOptions = [] as { value: string; label: string }[]

  return (
    <PageContainer sx={{ flex: 1 }}>
      <PageHeader pageTitle={trlb('cases_title')} />
      <Space20 />
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <FlexSelector
          label='cases_timePeriod'
          value={timePeriod}
          onChange={setTimePeriod}
          options={casesListTimePeriodOptions}
          sx={{ width: '200px' }}
        />
        <FlexSearchField
          searchText={searchText}
          setSearchText={setSearchText}
          sx={{ flex: 1 }}
        />
        <MissingFilters
          value={selectedMissingFilters}
          onConfirm={setSelectedMissingFilters}
          options={missingOptions}
          openLabelKey='cases_missingFilter_open'
          applyLabelKey='cases_missingFilter_confirm'
        />
        <MissingFilters
          value={missingInfoFilters}
          onConfirm={setMissingInfoFilters}
          options={missingInfoOptions}
          openLabelKey='openMissingoInfoFiltersButton'
          applyLabelKey='applyMissingInfoFiltersButton'
        />
      </Box>
      <Space10 />
      <CasesTable
        currentPage={currentPage}
        limit={limit}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortModelChange={onSortModelChange}
        cases={casesObject}
        sortModel={sortModel}
        total={total}
        getCSVDataFun={getExportedData}
      />
    </PageContainer>
  )
}

export default CasesListPage
