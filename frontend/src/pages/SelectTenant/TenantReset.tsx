import { Box, Menu, MenuItem, TextField } from '@mui/material'
import React from 'react'
import { TTenantRow } from './TenantsTable'
import { trlb } from 'utilities'
import StandardDialog from 'components/StandardDialog'
import { useResetTenant } from 'hooks/tenants'
import { useAppSelector } from 'store'
import { ITenant } from '@smambu/lib.constants'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'

const TenantReset = ({ row, onClose }: { row: TTenantRow; onClose: () => void }) => {
  const dispatch = useDispatch()
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const tenants = useAppSelector(state => state.tenants.tenants)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [originTenant, setOriginTenant] = React.useState<ITenant | null>(null)

  const [zipFile, setZipFile] = React.useState<File | null>(null)

  const [confirmText, setConfirmText] = React.useState('' as string | null)
  const [confirmTextTouched, setConfirmTextTouched] = React.useState(false)
  const resetTenant = useResetTenant()

  const exporableTenants = Object.values(tenants)
    .filter(tenant => tenant.exportable && tenant.tenantId !== row.tenantId)

  const onConfirm = async () => {
    if (originTenant != null)
      await resetTenant(row.tenantId, originTenant!.tenantId, undefined)
    else if (zipFile != null)
      await resetTenant(row.tenantId, undefined, zipFile)
    else
      throw new Error('Invalid state')

    onClose()
  }

  const onCancel = () => {
    onClose()
    setAnchorEl(null)
    setConfirmText('')
    setOriginTenant(null)
    setZipFile(null)
    setConfirmTextTouched(false)
  }

  const handleDataFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        setZipFile(file)
      } catch (e) {
        console.error(e)
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            type: 'error',
            text: 'resetTenant_fileNotValid_error',
          },
        })
      }
    }
    await reader.readAsText(file)
  }

  const zipName = zipFile?.name.split('.').slice(0, -1)
    .join('.') ?? ''

  const confirmError = confirmTextTouched && confirmText !== row.name ? trlb('resetTenant_confirmText_error') : ''

  const showConfirmDialog = originTenant != null || zipFile != null

  return (
    <>
      <MenuItem onClick={e => setAnchorEl(e.currentTarget)}>{trlb('resetTenant_button')}</MenuItem>
      <MenuItem>
        <Box component='label'>
          {trlb('resetTenant_loadFile_button')}
          <input type='file' accept='.zip' hidden onChange={e => { if (e.target.files?.[0]) handleDataFile(e.target.files?.[0]) }} />
        </Box>
      </MenuItem>
      <Menu
        id='dataset-menu'
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'dataset-menu-button',
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
        {exporableTenants.map(tenant => (
          <MenuItem key={tenant.tenantId} onClick={() => setOriginTenant(tenant)}>
            {tenant.name}
          </MenuItem>
        ))}
      </Menu>
      <StandardDialog
        open={showConfirmDialog}
        onClose={onCancel}
        titleKey={trlb('resetTenant_title', { tenantName: originTenant?.name! ?? zipName! })}
        textKey={trlb('resetTenant_text', { tenantName: row.name })}
        onConfirm={onConfirm}
        confirmDisabled={confirmText !== row.name || isLoading}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            textAlign: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2,
            py: 2,
          }}
        >
          <TextField
            label={trlb('resetTenant_confirmText')}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            onBlur={() => setConfirmTextTouched(true)}
            error={!!confirmError}
            helperText={confirmError}
            sx={{ width: 300 }}
            autoFocus
          />
        </Box>
      </StandardDialog>
    </>
  )
}

export default TenantReset
