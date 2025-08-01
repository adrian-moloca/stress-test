import React from 'react'
import { Box, IconButton, TextField } from '@mui/material'
import { PageContainer, PageHeader, Space20 } from 'components/Commons'
import { DefaultButton } from 'components/Buttons'
import AddIcon from '@mui/icons-material/Add'
import { routes } from 'routes/routes'
import { trlb } from '../utilities/translator/translator'
import { useAppSelector } from 'store'
import { Role, permissionRequests } from '@smambu/lib.constants'
import { useCheckPermission } from 'hooks/userPermission'
import { Edit } from '@mui/icons-material'
import { useNavigate } from 'react-router'
import { useGetCapabilitiesList, useGetRoles } from 'hooks/rolesHooks'
import { FlexDataTable } from 'components/FlexCommons'

const RolesListPage = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = React.useState('')
  const canViewRoles = useCheckPermission(permissionRequests.canViewRoles)
  const canCreateRole = useCheckPermission(permissionRequests.canCreateRole)
  const canEditRoles = useCheckPermission(permissionRequests.canEditRoles)
  useGetRoles()
  const { capabilitiesList } = useGetCapabilitiesList()
  const capabilitiesValues = React.useMemo(
    () => Object.values(capabilitiesList).map(cap => cap.value),
    [capabilitiesList],
  )

  const columns = React.useMemo(
    () => [
      { field: 'name', headerName: trlb('role_name'), flex: 1 },
      { field: 'scope', headerName: trlb('can_access_data'), flex: 1 },
      {
        field: 'userCount',
        headerName: trlb('n_users_with_role'),
        width: 200,
        type: 'number',
      },
      {
        field: 'capabilities',
        headerName: trlb('n_of_capabilities'),
        width: 200,
        valueGetter: (params: { row: Role }) => {
          const caps = params.row.capabilities.filter(cap => capabilitiesValues.includes(cap))
          return caps.length.toString()
        },
        type: 'number',
      },
      ...(canEditRoles
        ? [
          {
            field: 'edit',
            headerName: '',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params: { row: Role }) => {
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
                      navigate(routes.mapRoleEdit(params.row.id))
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
    ],
    [],
  )

  const roles = useAppSelector(state => state.roles)

  const filteredRows = React.useMemo(() => {
    if (searchText)
      return (Object.values(roles) || []).filter(role =>
        [role.name, role.scope]
          .join(' ')
          .toLowerCase()
          .includes((searchText ?? '').toLowerCase()))

    return Object.values(roles) || [] // TODO better initialize roles better
  }, [searchText, roles])

  const onRowClick = (row: { id: string }) => {
    canViewRoles && navigate(routes.mapRoleDetails(row.id))
  }

  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('roles')}>
        {canCreateRole && (
          <DefaultButton
            text={trlb('create_role')}
            icon={<AddIcon sx={{ mr: 1 }} />}
            onClick={() => navigate(routes.newRole)}
            sx={{ width: 300 }}
          />
        )}
      </PageHeader>

      <Space20 />
      <TextField label={trlb('commons_search')} value={searchText ?? ''} onChange={e => setSearchText(e.target.value)} />
      <Space20 />
      <FlexDataTable
        rows={filteredRows}
        columns={columns}
        onRowClick={onRowClick}
        autoHeight
      />
    </PageContainer>
  )
}
export default RolesListPage
