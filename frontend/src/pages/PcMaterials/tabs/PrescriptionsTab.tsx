import React, { useEffect, useState } from 'react'
import { Box, Button, IconButton } from '@mui/material'
import { trlb } from 'utilities'
import { useParams } from 'react-router-dom'
import { FlexDataTable, FlexSearchField } from 'components/FlexCommons'
import { GridDateRangeSelector, Space20 } from 'components/Commons'
import { getColumns } from '../components/PrescriptionsColumns'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useDebounce } from 'hooks'
import { useFetchPatient } from 'hooks/patientsHooks'
import ExportToolbar from '../components/PrescriptionsToolbar'
import { IPrescription, tCellData } from '@smambu/lib.constants'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useFetchPrescriptions, useGetPrescriptionsCSV } from 'hooks/pcMaterialsHooks'
import { getMuiDataGridData } from 'utilities/misc'

const paginationLimit = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT

const PrescriptionsTab = () => {
  const patientId = useParams().patientId
  const patient = useFetchPatient(patientId)
  const checkPermission = useGetCheckPermission()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const [searchText, setSearchText] = React.useState('')
  const debounceSearch = useDebounce(searchText)
  const getPrescriptionsCSV = useGetPrescriptionsCSV()

  const {
    prescriptions,
    currentPage,
    total,
    onPageChange,
    sortModel,
    onSortModelChange,
    onPageSizeChange,
    refreshCurrentPage,
    limit,
  } = useFetchPrescriptions(
    debounceSearch,
    0,
    paginationLimit,
    startDate,
    endDate,
    patient?.debtorNumber
  )

  useEffect(() => {
    const refresh = async () => {
      await refreshCurrentPage()
    }
    refresh()
  }, [])

  const filterByDate = () => {
    setStartDate(null)
    setEndDate(null)
  }

  const columns = getColumns({ refreshCurrentPage }).filter(column =>
    checkPermission(column.vPermission))

  const handleChangeDateRange = ([start, end]: [Date | null, Date | null]) => {
    setStartDate(start)
    setEndDate(end)
  }

  const onSearchTextChange = (text: string) => {
    setSearchText(text)
  }

  const computeCSVData = async (): Promise<tCellData[][]> => {
    const csvData = await getPrescriptionsCSV(
      debounceSearch,
      startDate,
      endDate,
      patient?.debtorNumber
    )

    if (csvData === undefined) return []

    const res = getMuiDataGridData(columns, csvData)

    return res
  }

  return (
    <>
      <Box sx={{ display: 'flex', width: 1, alignItems: 'center' }}>
        <IconButton onClick={refreshCurrentPage}>
          <RefreshIcon />
        </IconButton>
        <GridDateRangeSelector xs={4}
          value={[startDate, endDate]}
          onChange={handleChangeDateRange}
          allChanges />
        <Button
          variant={'text'}
          sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginInline: '10px' }}
          onClick={filterByDate}
        >
          {trlb('prescriptions_resetFilterPrescriptionsByDateButton')}
        </Button>
        <FlexSearchField
          searchText={searchText}
          setSearchText={onSearchTextChange}
          sx={{ flex: 3 }}
        />
      </Box>
      <Space20 />
      <FlexDataTable
        rows={prescriptions}
        columns={columns}
        pagination
        onPageChange={onPageChange}
        rowCount={total}
        getRowId={(row: IPrescription) => row._id}
        paginationMode={'server'}
        page={currentPage}
        sortingMode={'server'}
        sortingModel={sortModel}
        onSortModelChange={onSortModelChange}
        components={{ Toolbar: ExportToolbar }}
        componentsProps={{
          toolbar: {
            startDate,
            endDate,
            searchText,
            computeCSVData,
          },
        }}
        onPageSizeChange={onPageSizeChange}
        autoHeight
      />
    </>
  )
}

export default PrescriptionsTab
