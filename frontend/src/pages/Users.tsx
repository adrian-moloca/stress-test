import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { PageContainer, Space20 } from 'components/Commons'
import { DefaultButton } from 'components/Buttons'
import { routes } from 'routes/routes'
import { useAppSelector } from 'store'
import { IUser, Role, getFullName, getUserBirthDate, permissionRequests } from '@smambu/lib.constants'
import { trlb } from '../utilities/translator/translator'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useNavigate } from 'react-router'
import { useGetUsers } from 'hooks/userHooks'
import { FlexDataTable, FlexSearchField } from 'components/FlexCommons'

interface ColumnRenderProps {
  row: IUser
}

const getStatusString = (user: IUser) =>
  `${trlb(user.active ? 'user_active' : 'user_inactive')} - ${trlb(
    user.verified ? 'user_verified' : 'user_notVerified',
  )}`

const UsersListPage = () => {
  const [searchText, setSearchText] = React.useState('')
  const navigate = useNavigate()
  const users = Object.values(useAppSelector(state => state.users))
  const checkPermission = useGetCheckPermission()
  const canCreateUser = checkPermission(permissionRequests.canCreateUser)
  const canViewUsers = checkPermission(permissionRequests.canViewUsers)
  const canEditUsers = checkPermission(permissionRequests.canEditUsers)
  const getUsers = useGetUsers()
  const dateString = trlb('dateTime_date_string')

  const columns = [
    {
      field: 'fullName',
      headerName: trlb('userField_Name'),
      description: trlb('column_not_sortable'),
      flex: 1,
      valueGetter: ({ row }: ColumnRenderProps) => getFullName(row, true),
    },
    {
      field: 'roles',
      headerName: trlb('userField_roles'),
      flex: 1,
      valueGetter: ({ row }: ColumnRenderProps) =>
        (row.roles ?? [])
          .map((role: Role) => role.name)
          .sort((a, b) => a.localeCompare(b))
          .join(', '),
    },
    {
      field: 'birthDate',
      headerName: trlb('userField_BirthDate'),
      flex: 1,
      valueGetter: ({ row }: ColumnRenderProps) => getUserBirthDate(row, dateString),
      sortComparator: (v1: string, v2: string) =>
        new Date(v1).getTime() - new Date(v2).getTime(),
    },
    {
      field: 'email',
      headerName: trlb('userField_Email'),
      flex: 1,
    },
    {
      field: 'phoneNumber',
      headerName: trlb('userField_PhoneNumber'),
      flex: 1,
    },
    {
      field: 'status',
      headerName: trlb('userField_status'),
      flex: 1,
      valueGetter: ({ row }: ColumnRenderProps) => getStatusString(row),
    },
    {
      field: 'debtorNumber',
      headerName: trlb('userField_DebtorNumber'),
      flex: 1,
    },
    ...(canEditUsers
      ? [
        {
          field: 'edit',
          headerName: '',
          flex: 1,
          renderCell: ({ row }: ColumnRenderProps) => {
            const canEditUser = checkPermission(permissionRequests.canEditUser, { user: row })

            if (!canEditUser)
              return null

            return (
              <div
                style={{ cursor: 'pointer', marginLeft: '40px' }}
                onClick={e => {
                  e.stopPropagation()
                  navigate(routes.mapUserEdit(row.id))
                }}
              >
                <EditIcon color='primary' />
              </div>
            )
          },
        },
      ]
      : []),
  ]

  useEffect(() => {
    getUsers({})
  }, [])

  const rows = React.useMemo(() => {
    const filteredUsers = users
      .filter(user => checkPermission(permissionRequests.canViewUser, { user }))
    return !searchText
      ? filteredUsers
      : filteredUsers.filter((user: IUser) =>
        searchText.split(' ').every(
          searchWord =>
            getFullName(user).toLowerCase()
              .includes(searchWord) ||
              (user.roles ?? []).some((role: Role) => (role.name ?? '').toLowerCase().includes(searchWord)) ||
              getUserBirthDate(user, dateString).toLowerCase()
                .includes(searchWord) ||
              String(user.email ?? '')
                .toLowerCase()
                .includes(searchWord) ||
              (user.phoneNumber ?? '').toLowerCase().includes(searchWord) ||
              getStatusString(user).toLowerCase()
                .includes(searchWord) ||
              String(user.debtorNumber ?? '')
                .toLowerCase()
                .includes(searchWord),
        ))
  }, [searchText, users])

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box />
        <Typography variant='h5' sx={{ width: '100%', textAlign: 'center' }}>
          {trlb('users')}
        </Typography>
        {canCreateUser
          ? (
            <DefaultButton
              text={trlb('create_new_user')}
              icon={<AddIcon sx={{ mr: 1 }} />}
              onClick={() => navigate(routes.newUser)}
              sx={{ width: 300 }}
            />
          )
          : null}
      </Box>
      <Space20 />
      <FlexSearchField {...{ searchText, setSearchText }} />
      <Space20 />
      <FlexDataTable
        onRowClick={(row: IUser) => canViewUsers && navigate(routes.mapUserDetails(row.id))}
        rows={rows}
        columns={columns}
        autoHeight
      />
    </PageContainer>
  )
}

export default UsersListPage
