import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CasesTable from 'pages/CasesList/components/CasesTable'
import { useGetCheckPermission } from 'hooks/userPermission'
import {
  ILimitedCase,
  IUser,
  EPcMaterialsStatus,
  filtersSections,
  getFullName,
  permissionRequests,
  pcMaterialsStatus,
  Case,
} from '@smambu/lib.constants'
import { Box, CircularProgress, IconButton } from '@mui/material'
import { FlexAutocomplete } from 'components/FlexCommons'
import { trlb } from 'utilities'
import MissingFilters from 'pages/CasesList/components/MissingFilters'
import { useGetDoctors } from 'hooks/userHooks'
import { isAfter, isValid } from 'date-fns'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useFetchCases, useGetCasesCSV } from 'hooks/caseshooks'
import { GridDateRangeSelector } from 'components/Commons'
import { useReduxFilters } from 'hooks/filterHooks'
import CasesCommandsToolbar from '../components/CasesCommandsToolbar'
import { GridRenderCellParams } from '@mui/x-data-grid'

const statusOptions =
  pcMaterialsStatus.map(status => ({
    value: status.toString(),
    label: `pcMaterials_status_${status}`,
  }))

const CasesTab = () => {
  const checkPermission = useGetCheckPermission()
  const canViewDoctors = checkPermission(permissionRequests.canViewDoctors)
  const canViewUsers = checkPermission(permissionRequests.canViewUsers)

  const {
    statusFilters,
    setStatusFilters,
    selectedDoctorId,
    setSelectedDoctorId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    page,
    setPage,
    limit,
    setLimit,
    sortModel,
    setSortModel,
  } = useReduxFilters<filtersSections.PC_MATERIALS_CASES>(filtersSections.PC_MATERIALS_CASES)

  const dateError = isValid(startDate) && isValid(endDate) && isAfter(startDate!, endDate!)

  const [doctors, setDoctors] = useState<IUser[]>([])
  const selectedDoctor = doctors.find(doctor => doctor.id === selectedDoctorId)
  const selectedDoctorOption = {
    value: selectedDoctorId,
    label: getFullName(selectedDoctor, true) ?? ''
  }

  const statuses = useMemo(() => {
    let statuses: EPcMaterialsStatus[] = []

    if (statusFilters.length === 0) return pcMaterialsStatus
    if (statusFilters.length > 0)
      statuses.push(...statusFilters)

    return statuses
  }, [statusFilters])

  const {
    currentPage,
    onPageChange,
    onPageSizeChange,
    onSortModelChange,
    cases,
    total,
    onRowSelect,
    selectedCases,
  } = useFetchCases(
    page,
    setPage,
    limit,
    setLimit,
    sortModel,
    setSortModel,
    undefined,
    startDate ? startDate.getTime().toString() : undefined,
    endDate ? endDate.getTime().toString() : undefined,
    undefined,
    selectedDoctorId,
    undefined,
    undefined,
    undefined,
    statuses,
  )

  const getExportedData = useGetCasesCSV(
    undefined,
    startDate ? startDate.getTime().toString() : undefined,
    endDate ? endDate.getTime().toString() : undefined,
    undefined,
    selectedDoctorId,
    undefined,
    undefined,
    undefined,
    statuses,
  )

  const casesObject = cases.reduce((acc, current) => {
    acc[current.caseId] = current
    return acc
  }, {} as Record<string, ILimitedCase>)
  const getDoctors = useGetDoctors()

  const refreshCasesFunction = useCallback(() => {
    if (!dateError) {
      onRowSelect([])
      onPageChange(currentPage)
    }
  }, [dateError, onPageChange])

  useEffect(() => {
    refreshCasesFunction()

    getDoctors().then(docz => {
      if (docz) setDoctors(docz)
    })
  }, [])

  if (!cases) return null

  const additionalColumnns = [
    {
      index: 0,
      field: 'pcMaterialElaborationInProgress',
      headerName: '',
      translated: true,
      vPermission: permissionRequests.canViewPcMaterials,
      oPermission: permissionRequests.canViewPcMaterials,
      width: 50,
      type: 'special',
      sortable: false,
      filterable: false,
      disableExport: true,
      valueGetter: (caseItem: Case) => caseItem.pcMaterial?.elaborationInProgress,
      renderCell: ({ row: caseItem }: GridRenderCellParams) => {
        return caseItem.pcMaterialElaborationInProgress === true
          ? (
            <Box>
              <CircularProgress size={20} />
            </Box>
          )
          : null
      },
    },
    {
      valueGetter: (caseItem: Case) => {
        if (caseItem.pcMaterial == null) return ''

        const trlbString = caseItem.pcMaterial.cancelled
          ? 'pcMaterials_status_cancelled'
          : `pcMaterials_status_${caseItem.pcMaterial.status}`

        return trlb(trlbString)
      },
      index: 1.5,
      field: 'pcMaterialStatus',
      translated: true,
      vPermission: permissionRequests.canViewPcMaterials,
      oPermission: permissionRequests.canViewPcMaterials,
      type: 'string',
    }
  ]

  const handleChangeDateRange = ([start, end]: [Date | null, Date | null]) => {
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <>
      <Box sx={{ display: 'flex', width: 1, gap: 1, mb: 1, alignItems: 'center', height: 50 }}>
        <IconButton onClick={refreshCasesFunction}>
          <RefreshIcon />
        </IconButton>
        <GridDateRangeSelector xs={4}
          value={[startDate, endDate]}
          onChange={handleChangeDateRange}
          allChanges />
        {(canViewDoctors || canViewUsers) && (
          <FlexAutocomplete
            label={trlb('doctorFilterLabel')}
            options={Object.values(doctors).map(current => ({
              value: current.id,
              label: getFullName(current, true) as string,
            }))}
            onSelectValue={(_e, v) => setSelectedDoctorId(v?.value ?? '')}
            selected={selectedDoctorOption}
            sx={{ flexBasis: 0, flexGrow: 1, maxWidth: 300 }}
          />
        )}
        <MissingFilters
          value={statusFilters}
          onConfirm={newFilters => setStatusFilters(newFilters as EPcMaterialsStatus[])}
          options={statusOptions}
          openLabelKey='pcMaterials_status_filter'
          applyLabelKey='applyCaseStatusFilter'
        />
      </Box>
      <CasesTable
        cases={casesObject}
        additionalColumnns={additionalColumnns}
        selectable
        selectModel={selectedCases.map(c => c.caseId)}
        setSelectModel={onRowSelect}
        CustomToolbar={CasesCommandsToolbar}
        toolbarProps={{ selectedCases, refreshCasesFunction }}
        currentPage={currentPage}
        limit={limit}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortModelChange={onSortModelChange}
        sortModel={sortModel}
        total={total}
        keepNonExistentRowsSelected
        getCSVDataFun={getExportedData}
      />
    </>
  )
}

export default CasesTab
