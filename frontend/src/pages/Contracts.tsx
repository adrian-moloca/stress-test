import React, { useEffect, useState } from 'react'
import { Grid, IconButton, Button, Box } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import {
  PageContainer,
  PageHeader,
  Space20,
  GridDateSelector,
  GridTextField,
  GridAutocomplete,
} from 'components/Commons'
import { DefaultButton } from 'components/Buttons'
import { routes } from 'routes/routes'
import AddIcon from '@mui/icons-material/Add'
import { trlb } from '../utilities/translator/translator'
import { useNavigate } from 'react-router'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { IDataGridContract, IUser, QueryContractDto, eSortByContractsFields, filtersSections, getFullName, permissionRequests } from '@smambu/lib.constants'
import { format, isValid } from 'date-fns'
import { useGetContracts } from 'hooks/contractHooks'
import { useGetDoctors } from 'hooks/userHooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import { DRAFT_CONTRACT_ACTION } from 'store/actions'
import { useDispatch } from 'react-redux'
import { FlexDataTable } from 'components/FlexCommons'
import { useReduxFilters } from 'hooks/filterHooks'

const statusButtons = ['active', 'expired', 'all']

const ContractsListPage = () => {
  const navigate = useNavigate()
  const onNavigate = (id: IDataGridContract['contractId'], isEdit?: boolean) =>
    navigate(isEdit ? routes.mapContractEdit(id) : routes.mapContractDetails(id))
  const [contractList, setContractList] = useState<(IDataGridContract & { edit: any })[]>([])
  const [doctorList, setDoctorList] = useState<IUser[]>([])
  const [total, setTotal] = useState(0)
  const getContracts = useGetContracts()
  const getDoctors = useGetDoctors()
  const dispatch = useDispatch()

  const checkPermissions = useGetCheckPermission()
  const canCreateContract = checkPermissions(permissionRequests.canCreateContract)
  const canEditContracts = checkPermissions(permissionRequests.canEditContracts)

  const {
    validFrom,
    setValidFrom,
    validUntil,
    setValidUntil,
    search,
    setSearch,
    status,
    setStatus,
    doctorId,
    setDoctorId,
    page,
    setPage,
    limit,
    setLimit,
    sortModel,
    setSortModel,
  } = useReduxFilters<filtersSections.CONTRACTS>(filtersSections.CONTRACTS)

  React.useEffect(() => {
    dispatch({
      type: DRAFT_CONTRACT_ACTION.RESET_DRAFT_CONTRACT,
    })
  }, [dispatch])

  const dataGridColumn = (onNavigate: (id: IDataGridContract['contractId'], isEdit?: boolean) => void) => {
    return [
      {
        field: 'contractId',
        label: trlb('contract_id'),
      },
      {
        field: 'contractName',
        label: trlb('contractsTabel_contractName'),
      },
      {
        field: 'doctor',
        label: trlb('contractsTabel_doctor'),
        sortable: false,
      },
      {
        field: 'validFrom',
        label: trlb('contractsTabel_validFrom'),
      },
      {
        field: 'validUntil',
        label: trlb('contractsTabel_validUntil'),
      },
      {
        field: 'status',
        label: trlb('contractsTabel_status'),
        sortable: false,
      },
      ...(canEditContracts
        ? [
          {
            field: 'edit',
            label: trlb('contractsTabel_edit'),
            sortable: false,
          },
        ]
        : []),
    ]
      .map(item => {
        return {
          field: item.field,
          headerName: item.label,
          flex: 1,
          sortable: item.sortable ?? true,
          type: item.field.includes('valid') ? 'date' : 'string',
          valueFormatter: (params: GridRenderCellParams) =>
            item.field.includes('valid')
              ? format(new Date(params.value as string), trlb('dateTime_date_string'))
              : params.value,
          renderCell: (params: GridRenderCellParams) => {
            if (params.field === 'edit') {
              const canEditContract = checkPermissions(permissionRequests.canEditContract, {
                contract: { details: { doctorId: params.row.doctorId } },
              })
              if (!canEditContract) return null
              return (
                <IconButton
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onNavigate(params.id as any, true)
                  }}
                >
                  <EditIcon />
                </IconButton>
              )
            }
            if (params.field === 'status') return trlb(params.value as string)
          },
        }
      })
      .filter(el => (doctorList ? el : el.field !== 'doctor'))
  }

  const handleChooseStatus = (_status: any) => () => {
    setStatus(_status)
  }

  const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const fetchContracts = (queries?: QueryContractDto, abortController?: AbortController) => {
    getContracts(queries, abortController).then(res => {
      if (res.error?.name === 'AxiosCancellationError') return

      setTotal(res.total)
      setContractList(
        res.results?.map((contract: IDataGridContract) => ({
          id: contract.contractId,
          contractId: contract.contractId,
          doctorId: contract.details.doctorId,
          doctor: getFullName(contract.associatedDoctor, true),
          contractName: contract.details?.contractName ?? '',
          validFrom: format(new Date(contract.details.validFrom), 'MM/dd/yyyy hh:mm a'),
          validUntil: format(new Date(contract.details.validUntil), 'MM/dd/yyyy hh:mm a'),
          status: contract.details.status,
          edit: '',
        })) ?? [],
      )
    })
  }

  useEffect(() => {
    getDoctors()
      ?.then(res => setDoctorList(res))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const sortBy = sortModel[0]?.field as eSortByContractsFields
    const sortOrder = sortModel[0]?.sort ?? undefined
    fetchContracts(
      {
        search,
        doctorId,
        status,
        validFrom: isValid(validFrom) ? validFrom?.valueOf() : undefined,
        validUntil: isValid(validUntil) ? validUntil?.valueOf() : undefined,
        sortBy,
        limit,
        page,
        sortOrder,
        forDataGrid: true,
      },
      controller,
    )
    return () => {
      controller.abort()
    }
  }, [search, doctorId, status, validFrom, validUntil, sortModel, limit, page])

  const safeDoctorList = Array.isArray(doctorList) ? doctorList : []

  const doctorsOptions = safeDoctorList.map(el => ({
    value: el._id,
    label: getFullName(el, true),
  }))
  const selectedDoctor = doctorsOptions.find(el => el.value === doctorId)

  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('contracts')}>
        {canCreateContract && (
          <DefaultButton
            text={trlb('create_new_contract')}
            icon={<AddIcon sx={{ marginRight: '10px' }} />}
            onClick={() => navigate(routes.newContract)}
          />
        )}
      </PageHeader>
      <Space20 />
      <Grid container spacing={2} style={{ alignItems: 'center' }}>
        <GridTextField xs={12} label={trlb('find_contract')} onChange={onChangeSearch} value={search} />
        <GridDateSelector
          label={trlb('uploadcsv_validFrom')}
          xs={3}
          value={validFrom ?? ''}
          onChange={value => setValidFrom(value)}
        />
        <GridDateSelector
          label={trlb('uploadcsv_validUntil')}
          xs={3}
          value={validUntil ?? ''}
          onChange={value => setValidUntil(value)}
        />
        {doctorList && Array.isArray(doctorList) && (
          <GridAutocomplete
            xs={3}
            name={trlb('calendarCard_doctor')}
            label={trlb('calendarCard_doctor')}
            options={doctorsOptions}
            selected={selectedDoctor ?? null}
            onSelectValue={(_e: any, newDoctor: any) => setDoctorId(newDoctor?.value)}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            m: 1,
            mt: 3,
            flexGrow: 1,
          }}
        >
          {statusButtons.map(el => (
            <Button key={el} variant={el === status ? 'contained' : 'outlined'} onClick={handleChooseStatus(el as any)}>
              {trlb(el === 'all' ? 'calendar_or_all' : el)}
            </Button>
          ))}
        </Box>
      </Grid>
      <Space20 />
      <FlexDataTable
        rows={contractList}
        sortingMode='server'
        disableColumnFilter
        onSortModelChange={setSortModel}
        sortModel={sortModel}
        columns={dataGridColumn(onNavigate)}
        onRowClick={(row: any) => navigate(routes.mapContractDetails(row.id))}
        autoHeight
        paginationMode='server'
        rowCount={total}
        pageSize={limit}
        onPageChange={(newPage: number) => setPage(newPage)}
        page={page}
        onPageSizeChange={(newPageSize: number) => {
          setLimit(newPageSize)
          setPage(0)
        }}
      />
    </PageContainer>
  )
}

export default ContractsListPage
