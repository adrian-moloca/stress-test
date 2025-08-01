import React from 'react'
import { Typography } from '@mui/material'
import { useAppSelector } from 'store'

const TenantBadge = () => {
  const user = useAppSelector(state => state.auth.user)
  const tenants = useAppSelector(state => state.tenants.tenants)
  const activeTenant = tenants[user?.tenantId]

  if (activeTenant == null) return null

  return (
    <Typography
      sx={{
        borderRadius: theme => theme.constants.radius,
        border: theme => '1px solid ' + theme.palette.primary.main,
        color: theme => theme.palette.primary.main,
        mr: 2,
        px: 1,
        fontWeight: 'bold',
        height: 'fit-content',
        whiteSpace: 'nowrap',
      }}
    >
      {activeTenant.name}
    </Typography>
  )
}

export default TenantBadge
