import React from 'react'
import { PageContainer, PageHeader, Space20, Space10 } from 'components/Commons'
import { DefaultButton } from 'components/Buttons'
import { Add, Edit } from '@mui/icons-material'
import { Box, Grid, IconButton } from '@mui/material'
import { routes } from 'routes/routes'
import { trlb } from '../utilities/translator/translator'
import { useNavigate } from 'react-router'
import {
  AnesthesiologistOpStandard,
  AnesthesiologistOpStandardQueryKeys,
  permissionRequests,
} from '@smambu/lib.constants'
import { useGetAnesthesiologistOPStandards } from 'hooks'
import { GridSortModel } from '@mui/x-data-grid'
import { useGetCheckPermission } from 'hooks/userPermission'
import { format, isValid, parse } from 'date-fns'
import { FlexDataTable, FlexSearchField } from 'components/FlexCommons'

const defaultSort: {
  sortBy: AnesthesiologistOpStandardQueryKeys
  sortOrder: 'desc' | 'asc'
} = {
  sortBy: 'name',
  sortOrder: 'desc',
}

export const fieldNameOf = <T, >(name: keyof T) => name

const defaultPaginationLimit = Number(import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT)

const AnestesiologistOPStandardList = () => {
  const navigate = useNavigate()

  const checkPermission = useGetCheckPermission()
  const canEditAnesthesiologistOpStandards = checkPermission(permissionRequests
    .canEditAnesthesiologistOpStandards)
  const canCreateAnesthesiologistOpStandard = checkPermission(permissionRequests
    .canCreateAnesthesiologistOpStandard)

  const [searchText, setSearchText] = React.useState('')
  const [queryOptions, setQueryOptions] = React.useState<{
    sortBy: AnesthesiologistOpStandardQueryKeys
    sortOrder: 'desc' | 'asc'
  }>(defaultSort)

  const handleSortModelChange = React.useCallback((sortModel: GridSortModel) => {
    if (sortModel && sortModel.length > 0)
      setQueryOptions({
        sortBy: sortModel[0].field as unknown as AnesthesiologistOpStandardQueryKeys,
        sortOrder: sortModel[0].sort as unknown as 'desc' | 'asc',
      })
    else setQueryOptions(defaultSort)
  }, [])

  const [paginationModel, setPaginationModel] = React.useState<{
    page: number
    pageSize: number
  }>({
    pageSize: defaultPaginationLimit,
    page: 1,
  })

  const OPStandardsList = useGetAnesthesiologistOPStandards(
    searchText,
    paginationModel.page,
    paginationModel.pageSize,
    queryOptions.sortBy,
    queryOptions.sortOrder,
  )

  const totalPages = React.useMemo(() => (OPStandardsList ? OPStandardsList.total : 0),
    [OPStandardsList])

  const columns = [
    {
      field: fieldNameOf<AnesthesiologistOpStandard>('anesthesiologistOpStandardId'),
      headerName: trlb('anesthesiologistOPStandard_detail_id'),
      flex: 1,
    },
    {
      field: fieldNameOf<AnesthesiologistOpStandard>('name'),
      headerName: trlb('anesthesiologistOPStandard_detail_name'),
      flex: 1,
    },
    {
      field: fieldNameOf<AnesthesiologistOpStandard>('validFrom'),
      headerName: trlb('anesthesiologistOPStandard_detail_validFrom'),
      valueGetter: (params: { row: AnesthesiologistOpStandard }) => {
        return isValid(new Date(params.row.validFrom))
          ? format(new Date(params.row.validFrom), trlb('dateTime_date_string'))
          : ''
      },
      sortComparator: (v1: string, v2: string) => {
        const date1 = parse(v1, trlb('dateTime_date_string'), new Date())
        const date2 = parse(v2, trlb('dateTime_date_string'), new Date())
        return date1.getTime() - date2.getTime()
      },
      flex: 1,
    },
    ...(canEditAnesthesiologistOpStandards
      ? [
        {
          field: 'edit',
          headerName: '',
          width: 100,
          sortable: false,
          filterable: false,
          renderCell: (params: { row: AnesthesiologistOpStandard }) => {
            const canEditAnesthesiologistOpStandard = checkPermission(
              permissionRequests.canEditAnesthesiologistOpStandard,
              { anesthesiologistOpStandard: params.row },
            )
            if (!canEditAnesthesiologistOpStandard) return null
            return (
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <IconButton
                  onClick={e => {
                    e.stopPropagation()
                    navigate(routes
                      .mapAnesthesiologistOPStandardEdit(params.row.anesthesiologistOpStandardId))
                  }}
                >
                  <Edit />
                </IconButton>
              </Box>
            )
          },
        },
      ]
      : []),
  ]

  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('anest_op_standard')}>
        {canCreateAnesthesiologistOpStandard && (
          <DefaultButton
            text={trlb('create_op_standard')}
            icon={<Add sx={{ marginRight: '10px' }} />}
            onClick={() => navigate(routes.addNewAnesthesiologistOPStandard)}
          />
        )}
      </PageHeader>
      <Space20 />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* TODO remove this? <SectionTitle text={trlb('contract_op_standard')} /> */}
        <Grid container spacing={2}>
          <Space10 />
          <Grid item xs={12}>
            <FlexSearchField searchText={searchText} setSearchText={setSearchText} sx={{ width: '100%' }} />
          </Grid>
          <Space20 />
          <Box sx={{ width: '100%', paddingLeft: '16px' }}>
            <FlexDataTable
              columns={columns}
              rows={OPStandardsList?.results || []}
              onRowClick={(row: { id: string }) => navigate(routes
                .mapAnesthesiologistOPStandardDetails(row.id))}
              paginationModel={paginationModel}
              rowCount={totalPages}
              paginationMode='server'
              onSortModelChange={handleSortModelChange}
              onPageChange={(newPage: number) => {
                setPaginationModel({ ...paginationModel, page: newPage + 1 })
              }}
              onPageSizeChange={(newPageSize: number) => {
                setPaginationModel({ ...paginationModel, pageSize: newPageSize })
              }}
              autoHeight
            />
          </Box>
        </Grid>
      </Box>
    </PageContainer>
  )
}

export default AnestesiologistOPStandardList
