import React from 'react'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { useGetCheckPermission } from 'hooks/userPermission'
import { permissionRequests, tCellData } from '@smambu/lib.constants'
import ExportButton from 'components/ExportButton'
import { trlb } from 'utilities'
import { format } from 'date-fns'

type tCustomToolbarProps = {
  getData: () => Promise<tCellData[][]> | tCellData[][]
}

const CustomToolbar = ({ getData }: tCustomToolbarProps) => {
  const checkPermission = useGetCheckPermission()
  const canExportCases = checkPermission(permissionRequests.canExportCases)
  return (
    <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey', pb: 0.5 }}>
      {canExportCases && (
        <ExportButton
          noClipboard
          getData={getData}
          title={`${trlb('cases_label')}_${format(new Date(), trlb('dateTime_datetime_csv_string'))}`}
        />
      )}
    </GridToolbarContainer>
  )
}

export default CustomToolbar
