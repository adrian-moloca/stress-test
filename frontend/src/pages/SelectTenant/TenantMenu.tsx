import { MoreHoriz } from '@mui/icons-material'
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material'
import React from 'react'
import { TTenantRow } from './TenantsTable'
import TenantReset from './TenantReset'
import TenantExport from './TenantExport'
import { useNavigate } from 'react-router-dom'
import { routes } from 'routes/routes'
import { trlb } from 'utilities'

const TenantMenu = ({ row }: { row: TTenantRow }) => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  if (!row.isSuperAdmin) return null

  if (row.isResetting) return <CircularProgress size={20} />

  return (
    <>
      <Button sx={{ minWidth: 0, px: 1 }} onClick={e => setAnchorEl(e.currentTarget)}>
        <MoreHoriz />
      </Button>
      <Menu
        id='tenant-menu'
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'menu-button',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{ zIndex: 2000 }}
      >
        <MenuItem
          onClick={() =>
            navigate(routes.mapUniversalConfigurations(row.tenantId))}
        >
          {trlb('ur_configs_button')}
        </MenuItem>
        {row.resettable && <TenantReset row={row} onClose={() => setAnchorEl(null)} />}
        {row.exportable && <TenantExport row={row} />}
      </Menu>
    </>
  )
}

export default TenantMenu
