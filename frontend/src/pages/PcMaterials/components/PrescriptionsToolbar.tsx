import React from 'react'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { IPrescription, permissionRequests, tCellData } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import ExportButton from 'components/ExportButton'
import { format } from 'date-fns'
import { trlb } from 'utilities'

type IExportToolbarProps = {
  receipts: IPrescription[]
  refreshCurrentPage: () => void
  computeCSVData: () => Promise<tCellData[][]> | tCellData[][]
}

const ReceiptsToolbar = ({
  computeCSVData,
}: IExportToolbarProps) => {
  const checkPermission = useGetCheckPermission()
  const canDownloadBills = checkPermission(permissionRequests.canDownloadBills)

  const dateTimeFormatString = trlb('dateTime_datetime_csv_string')
  const formattedDate = format(new Date(), dateTimeFormatString)
  const csvInvoicesPrefix = trlb('csv_invoices_prefix')

  const csvTitle = `${csvInvoicesPrefix}_${formattedDate}`

  return (
    <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey', pb: 0.5 }}>
      {canDownloadBills && (
        <ExportButton
          noClipboard
          getData={computeCSVData}
          title={csvTitle}
        />
      )}
    </GridToolbarContainer>
  )
}

export default ReceiptsToolbar
