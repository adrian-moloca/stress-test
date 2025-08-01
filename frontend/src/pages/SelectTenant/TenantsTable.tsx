import { IUser } from '@smambu/lib.constants'
import { ITenant } from '@smambu/lib.constants/src/types/tenants'
import { Button } from '@mui/material'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { FlexDataTable } from 'components/FlexCommons'
import React from 'react'
import { trlb } from 'utilities'
import TenantMenu from './TenantMenu'

export type TTenantRow = ITenant & {
  userStatus: boolean
  isSuperAdmin: boolean
}

const getColumns = (onTenantClick: (tenantId: string) => void) => [
  {
    field: 'name',
    headerName: trlb('selectTenant_table_name'),
    flex: 1,
    type: 'text',
  },
  {
    field: 'userStatus',
    headerName: trlb('selectTenant_table_userStatus'),
    flex: 1,
    type: 'text',
    renderCell: (params: GridRenderCellParams) => {
      return params.row.userStatus === true
        ? trlb('selectTenant_table_userStatus_active')
        : trlb('selectTenant_table_userStatus_inactive')
    },
  },
  {
    field: 'selectButton',
    headerName: '',
    flex: 1,
    type: 'text',
    renderCell: (params: GridRenderCellParams) => (
      <Button
        disabled={params.row.isResetting}
        size='small'
        variant='contained'
        onClick={() => onTenantClick(params.row.tenantId)}
      >
        {trlb('selectTenant_table_login')}
      </Button>
    ),
  },
  {
    field: 'menu',
    headerName: '',
    type: 'text',
    width: 60,
    renderCell: (params: GridRenderCellParams) => <TenantMenu row={params.row} />,
  },
]

const TenantsTable = ({
  tenants,
  users,
  onTenantClick,
  isSuperAdmin,
}: {
  tenants: ITenant[]
  users: IUser[]
  onTenantClick: (tenantId: string) => void
  isSuperAdmin: boolean
}) => {
  const columns = getColumns(onTenantClick)
  const rows = tenants.map((tenant): TTenantRow => {
    const user = users.find(u => u.tenantId === tenant.tenantId)
    return {
      name: tenant.name,
      tenantId: tenant.tenantId,
      userStatus: user!.active,
      resettable: tenant.resettable,
      isResetting: tenant.isResetting,
      exportable: tenant.exportable,
      isExporting: tenant.isExporting,
      dataFiles: tenant.dataFiles,
      isSuperAdmin,
    }
  })
  return (
    <>
      <FlexDataTable
        rows={rows}
        columns={columns}
        getRowId={(row: any) => row.tenantId}
        disableSelectionOnClick
        autoHeight
      />
    </>
  )
}

export default TenantsTable
