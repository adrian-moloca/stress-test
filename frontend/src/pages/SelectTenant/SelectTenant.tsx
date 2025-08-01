import { Box, Typography } from '@mui/material'
import { useSelectTenant } from 'hooks'
import React, { useState } from 'react'
import { useAppSelector } from 'store'
import logo from 'assets/img/LogoSMAMBU.png'
import { trlb } from 'utilities'
import TenantsTable from './TenantsTable'
import TenantLoginDialog from './TenantLoginDialog'

const SelectTenant: React.FC = () => {
  const isSuperAdmin = useAppSelector(state => state.auth?.credential?.isSuperAdmin)
  const email = useAppSelector(state => state.auth.credential?.email)
  const tenantsState = useAppSelector(state => state.tenants.tenants)
  const users = useAppSelector(state => state.tenants.users)
  const [clickedTenant, setClickedTenant] = useState<string | null>(null)
  const selectTenant = useSelectTenant()
  const tenantsList = Object.values(tenantsState)

  const onConfirm = () => {
    if (clickedTenant === null) return
    selectTenant({
      email,
      tenantId: clickedTenant,
    })
    setClickedTenant(null)
  }

  return (
    <Box
      sx={{
        boxShadow: theme => theme.constants.boxShadow,
        borderRadius: theme => theme.constants.radius,
        padding: '20px 32px',
        minWidth: '500px',
        maxWidth: '500px',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <img src={logo} width={160} />
        </Box>
        <Box sx={{ width: '100%', textAlign: 'center', mb: 4 }}>
          <Typography>{trlb('selectTenant_title')}</Typography>
        </Box>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 2, textAlign: 'center' }}>
          {tenantsList.length > 0
            ? (
              <TenantsTable
                tenants={tenantsList}
                users={Object.values(users)}
                onTenantClick={tenantId => {
                  setClickedTenant(tenantId)
                }}
                isSuperAdmin={isSuperAdmin}
              />
            )
            : (
              <Typography color='error'>{trlb('selectTenant_noTenants', { email })}</Typography>
            )}
        </Box>
        <TenantLoginDialog
          open={clickedTenant !== null}
          title={trlb('selectTenant_warnigDialog_title', {
            tenantName: Object.values(tenantsState).find(t => t.tenantId === clickedTenant)?.name ?? '',
          })}
          text={'selectTenant_warnigDialog_body'}
          onClose={() => setClickedTenant(null)}
          onConfirm={onConfirm}
        />
      </Box>
    </Box>
  )
}

export default SelectTenant
