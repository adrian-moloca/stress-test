import React from 'react'
import { Box, Autocomplete, TextField } from '@mui/material'
import { IRoles, Role } from '@smambu/lib.constants'
import { Search } from '@mui/icons-material'
import { trlb } from 'utilities'

const CopyRoleCapabilites = ({
  role,
  edit,
  roles,
  form,
}: {
  role?: Role
  edit?: boolean
  roles: IRoles
  form: any
}) => {
  const [selectRoleInputValue, setSelectRoleInputValue] = React.useState<string>('')

  const copiableRoles = React.useMemo(
    () => Object.values(roles).filter(r => r.id !== role?.id && r.capabilities.length > 0),
    [roles, role?.id],
  )
  const addCapabilities = (capabilities: string[]) => {
    form.setFieldValue('capabilities', [...new Set([...form.getFieldProps('capabilities').value, ...capabilities])])
  }
  const copyRole = (role: Role | null) => {
    addCapabilities(role?.capabilities ?? [])
    setSelectRoleInputValue('')
  }

  if (!edit) return <Box sx={{ width: 300 }} />
  return (
    <Autocomplete
      renderInput={(params: any) => (
        <TextField {...params} label={`${trlb('role_copyRoleCapabilities')}`} size='small' />
      )}
      sx={{ width: 300 }}
      onChange={(_event: any, newValue: Role | null) => {
        copyRole(newValue)
      }}
      options={copiableRoles}
      getOptionLabel={option => option.name}
      popupIcon={<Search />}
      inputValue={selectRoleInputValue}
      onInputChange={(_event, newInputValue) => setSelectRoleInputValue(newInputValue)}
      value={null}
    />
  )
}

export default CopyRoleCapabilites
