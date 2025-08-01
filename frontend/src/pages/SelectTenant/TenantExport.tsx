import { CircularProgress, IconButton, MenuItem } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'
import { TTenantRow } from './TenantsTable'
import { useDownloadTenantData, useExportTenant } from 'hooks/tenants'
import { Download } from '@mui/icons-material'
import { TTenantDataFile } from '@smambu/lib.constants'

const TenantExport = ({ row }: { row: TTenantRow }) => {
  const exportTenant = useExportTenant()
  const downloadTenantData = useDownloadTenantData()
  const lastDataFile = row.dataFiles[row.dataFiles.length - 1]

  const onDownload = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    lastDataFile: TTenantDataFile) => {
    e.stopPropagation()
    downloadTenantData(lastDataFile)
  }

  return (
    <MenuItem disabled={row.isExporting} onClick={() => exportTenant(row.tenantId)}>
      {trlb('exportTenant_copy_button')}
      {row.isExporting && <CircularProgress size={20} sx={{ marginLeft: 2 }} />}
      {!row.isExporting && lastDataFile != null && (
        <IconButton onClick={e => onDownload(e, lastDataFile)}>
          <Download />
        </IconButton>
      )}
    </MenuItem>
  )
}

export default TenantExport
