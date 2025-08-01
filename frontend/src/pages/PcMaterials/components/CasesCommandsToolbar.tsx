import { GridToolbarContainer } from '@mui/x-data-grid'
import React from 'react'
import { trlb } from 'utilities'
import { ILimitedCase, InvoiceType, permissionRequests, tCellData } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import ExportButton from 'components/ExportButton'
import { format } from 'date-fns'
import PrescriptionsPreview from './PrescriptionsPreview'

interface ICommandsToolbarProps {
  selectedCases: ILimitedCase[]
  refreshCasesFunction: () => void
  selectedInvoicesTypes?: InvoiceType[]
  getData: () => Promise<tCellData[][]> | tCellData[][]
}

const CasesCommandsToolbar: React.FC<ICommandsToolbarProps> = ({
  selectedCases,
  refreshCasesFunction,
  getData
}) => {
  const checkPermission = useGetCheckPermission()
  const canExportCases = checkPermission(permissionRequests.canExportCases)

  const title = `${trlb('cases_label')}_${format(new Date(), trlb('dateTime_datetime_csv_string'))}`

  return (
    <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey', pb: 0.5 }}>
      {canExportCases && (
        <ExportButton
          noClipboard
          getData={getData}
          title={title}
        />
      )}
      <PrescriptionsPreview
        selectedCases={selectedCases}
        type='generate'
        refreshCurrentPage={refreshCasesFunction}
      />
    </GridToolbarContainer>
  )
}

export default CasesCommandsToolbar
