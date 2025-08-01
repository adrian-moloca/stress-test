import React from 'react'
import { Typography, Grid, IconButton, Box, Autocomplete, TextField } from '@mui/material'
import { Panel, Space20 } from 'components/Commons'
import { DefaultButton, TextIconButton } from 'components/Buttons'
import AddIcon from '@mui/icons-material/Add'
import { trlb } from 'utilities'
import { PERMISSIONS_DOMAINS_SCOPES, Role, IUser, ISelectedRole, getFullName } from '@smambu/lib.constants'
import { Delete } from '@mui/icons-material'

interface IUserRolesProps {
  canViewRoles: boolean
  selectedRoles: ISelectedRole[]
  setSelectedRoles: (roles: ISelectedRole[]) => void
  users: IUser[]
  edit: boolean
  roles: Role[]
}

const UserRoles = ({
  canViewRoles,
  selectedRoles,
  setSelectedRoles,
  users,
  edit,
  roles
}: IUserRolesProps) => {
  const setRole = (roleIndex: number, roleId: string | null) => {
    if (selectedRoles[roleIndex].roleId === roleId) return
    const newRoles = [...selectedRoles]
    if (roleId === null) newRoles.splice(roleIndex, 1)
    else newRoles[roleIndex].roleId = roleId
    setSelectedRoles(newRoles)
  }

  const setRoleUser = (roleIndex: number, userIndex: number, userId: string | null) => {
    if (selectedRoles[roleIndex].users[userIndex] === userId) return
    const newRoles = [...selectedRoles]
    if (userId === null) newRoles[roleIndex].users.splice(userIndex, 1)
    else newRoles[roleIndex].users[userIndex] = userId
    setSelectedRoles(newRoles)
  }

  const addRole = () => {
    setSelectedRoles([
      ...selectedRoles,
      {
        roleAssociationId: 'new',
        roleId: '',
        users: [],
      },
    ])
  }

  if (!canViewRoles)
    return (
      <Typography variant='subtitle1' sx={{ width: '100%', textAlign: 'center' }}>
        {trlb('users_noViewRoles_error')}
      </Typography>
    )

  return (
    <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {!selectedRoles?.length && (
        <Typography variant='body1' sx={{ mx: 'auto' }}>
          {trlb('no_roles_selected')}
        </Typography>
      )}
      {selectedRoles.map((selectedRole, roleIndex) => (
        <RolePanel
          key={selectedRole.roleId + roleIndex}
          edit={edit}
          selectedRole={selectedRole}
          selectedRoles={selectedRoles}
          setRole={setRole}
          setRoleUser={setRoleUser}
          roles={roles}
          users={users}
          roleIndex={roleIndex}
        />
      ))}
      {edit
        ? (
          <>
            <Space20 />
            <DefaultButton
              text={trlb('add_another_role')}
              icon={<AddIcon sx={{ marginRight: '10px' }} />}
              onClick={addRole}
            />
          </>
        )
        : null}
    </Grid>
  )
}

const RolePanel = ({
  edit,
  selectedRole,
  selectedRoles,
  setRole,
  setRoleUser,
  roles,
  users,
  roleIndex,
}: {
  edit: boolean
  selectedRole: ISelectedRole
  selectedRoles: ISelectedRole[]
  setRole: (roleIndex: number, roleId: string | null) => void
  setRoleUser: (roleIndex: number, userIndex: number, userId: string | null) => void
  roles: Role[]
  users: IUser[]
  roleIndex: number
}) => {
  const role = roles.find(role => role.id === selectedRole.roleId)
  const anotherUserScope =
    role?.scope === PERMISSIONS_DOMAINS_SCOPES.ANOTHER_USER_DATA ||
    Object.values(role?.domain_scopes ?? {}).includes(PERMISSIONS_DOMAINS_SCOPES.ANOTHER_USER_DATA)

  const availableRoles = roles.filter(
    role => role.id === selectedRole.roleId ||
    !selectedRoles.some(selectedRole => selectedRole.roleId === role.id),
  )

  if (!roles.length) return null

  return (
    <Panel sx={{ mb: 2, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Autocomplete
          value={role}
          onChange={(_e, value) => setRole(roleIndex, value.id)}
          options={availableRoles}
          getOptionLabel={option => option.name}
          renderInput={params => <TextField label={trlb('role')} {...params} />}
          disabled={!edit}
          disableClearable
          sx={{ width: '100%' }}
        />
        {edit && (
          <IconButton size='small' onClick={() => setRole(roleIndex, null)}>
            <Delete />
          </IconButton>
        )}
      </Box>
      {anotherUserScope && (
        <>
          <Typography
            variant='subtitle1'
            sx={{
              my: 1,
              fontWeight: selectedRole.users?.length ? undefined : 'bold',
            }}
          >
            {trlb(selectedRole.users?.length ? 'users_associated_with' : 'no_users_associated_with')}
          </Typography>
          {selectedRole.users.map((userId, userIndex) => {
            const avaibleUsers = users.filter(
              user => user.id === userId || !selectedRole.users.some(userId => userId === user.id),
            )
            return (
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }} key={userId + userIndex}>
                <Autocomplete
                  value={users.find(user => user.id === userId)}
                  onChange={(_e, value) => setRoleUser(roleIndex, userIndex, value.id)}
                  options={avaibleUsers}
                  getOptionLabel={option => getFullName(option, true)}
                  renderInput={params => <TextField label={trlb('table_field_userName')} {...params} />}
                  disabled={!edit}
                  disableClearable
                  sx={{ width: '100%', my: 1 }}
                />
                {edit && (
                  <IconButton size='small' onClick={() => setRoleUser(roleIndex, userIndex, null)}>
                    <Delete />
                  </IconButton>
                )}
              </Box>
            )
          })}
          {edit
            ? (
              <TextIconButton
                text={trlb('add_another_user')}
                disabled={selectedRole.users.length >= users.length}
                icon={<AddIcon sx={{ marginRight: '10px' }} />}
                onClick={() => setRoleUser(roleIndex, selectedRole.users.length, 'new')}
              />
            )
            : null}
        </>
      )}
    </Panel>
  )
}

export default UserRoles
