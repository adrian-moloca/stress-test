import React from 'react'
import { Grid, IconButton } from '@mui/material'
import { PageContainer, PageHeader, Space20 } from 'components/Commons'
import { routes } from 'routes/routes'
import { trlb } from '../utilities/translator/translator'
import { useNavigate } from 'react-router'
import { Patient, permissionRequests } from '@smambu/lib.constants'
import { useDebounce } from 'hooks'
import { useFetchPatients } from 'hooks/patientsHooks'
import { useSearchParams } from 'react-router-dom'
import { useGetCheckPermission } from 'hooks/userPermission'
import { format, isValid } from 'date-fns'
import { FlexDataTable, FlexSearchField } from 'components/FlexCommons'
import EditIcon from '@mui/icons-material/Edit'

interface ColumnRenderProps {
  value: string | number | boolean | Date
  row: Patient
}

const PatientsListPage = () => {
  const navigate = useNavigate()
  const checkPermission = useGetCheckPermission()

  const columns = [
    {
      field: 'patientNumber',
      headerName: trlb('patientForm_PatientNumber'),
      flex: 2,
      minWidth: 150,
      filterable: false,
    },
    { field: 'name', headerName: trlb('userField_Name'), flex: 1, minWidth: 70, filterable: false },
    { field: 'surname', headerName: trlb('userField_Surname'), flex: 1, minWidth: 70, filterable: false },
    {
      field: 'birthDate',
      headerName: trlb('date_of_birth'),
      type: 'date',
      flex: 1,
      minWidth: 70,
      valueFormatter: ({ value }: ColumnRenderProps) => {
        if (!isValid(value)) return ''
        return format(value as Date, trlb('dateTime_date_string'))
      },
      filterable: false,
    },
    {
      field: 'edit',
      headerName: trlb('edit'),
      flex: 1,
      minWidth: 70,
      sortable: false,
      filterable: false,
      renderCell: ({ row }: ColumnRenderProps) => {
        const canEditPatient = checkPermission(permissionRequests.canEditPatient, {
          patient: patients.find(p => p.patientId === row.patientId),
        })
        return (
          <>
            {canEditPatient
              ? (
                <IconButton
                  onClick={e => {
                    e.stopPropagation()
                    navigate(routes.editPatient.replace(':patientId', row.patientId))
                  }}
                >
                  <EditIcon />
                </IconButton>
              )
              : null}
          </>
        )
      },
    },
  ]

  const [searchParams] = useSearchParams()
  const [searchText, setSearchText] = React.useState(searchParams.get('query') || '')
  const debounceSearch = useDebounce(searchText)

  const {
    patients,
    currentPage,
    limit,
    total,
    onPageChange,
    sortModel,
    onSortModelChange,
    onPageSizeChange
  } =
    useFetchPatients(debounceSearch, 0)

  const rows = (patients || []).map(patient => ({
    id: patient.patientId,
    patientId: patient.patientId,
    patientNumber: patient.patientNumber,
    surname: patient.surname,
    name: patient.name,
    birthDate: patient.birthDate,
    edit: checkPermission(permissionRequests.canEditPatient, { patient }),
  }))

  const onRowClick = (row: any) => {
    navigate(routes.mapPatientDetails(row.id))
  }

  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('patients')} />
      <Space20 />
      <Grid container spacing={2}></Grid>
      <Space20 />
      <FlexSearchField {...{ searchText, setSearchText }} />
      <Space20 />
      <FlexDataTable
        {...{
          rows,
          columns,
          onRowClick,
          pagination: true,
          onPageChange,
          pageSize: limit,
          rowCount: total,
          paginationMode: 'server',
          page: currentPage,
          sortingMode: 'server',
          sortingModel: sortModel,
          onSortModelChange,
          onPageSizeChange,
          autoHeight: true,
        }}
      />
    </PageContainer>
  )
}

export default PatientsListPage
