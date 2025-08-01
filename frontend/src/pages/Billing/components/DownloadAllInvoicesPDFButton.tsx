import {
  InvoiceType,
  permissionRequests,
  ToastType,
} from '@smambu/lib.constants'
import { Button } from '@mui/material'
import { useArchiveAllEligibles } from 'hooks/pdfArchiveHooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'
import { trlb } from 'utilities'

interface IDownloadAllInvoicesPDFButtonProps {
  invoicesTypes: InvoiceType[]
  disableButton: boolean
  startDate: Date | null
  endDate: Date | null
  searchText: string
  deselectFun: () => void
}

const DownloadAllInvoicesPDFButton: React.FC<IDownloadAllInvoicesPDFButtonProps> = ({
  invoicesTypes,
  disableButton,
  startDate,
  endDate,
  searchText,
  deselectFun
}) => {
  const archiveAllEligibles = useArchiveAllEligibles()

  const checkPermissions = useGetCheckPermission()
  const canDownloadBills = checkPermissions(permissionRequests.canDownloadBills)

  const dispatch = useDispatch()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    archiveAllEligibles(startDate, endDate, searchText, invoicesTypes)
    deselectFun()

    dispatch({
      type: GLOBAL_ACTION.ADD_TOAST,
      data: {
        type: ToastType.success,
        text: 'archiveRequestSent',
      },
    })
  }

  // since all the needed checks are done by the backend, we disable the button
  // only if there are no invoices available for the current search parameters
  // to avoid "empty" calls
  const buttonLabel = trlb('archiveAllInvoicesPDFLabel')

  if (!canDownloadBills) return null

  return (
    <Button
      variant={'text'}
      sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginInline: '10px' }}
      onClick={handleClick}
      disabled={disableButton}
    >
      {buttonLabel}
    </Button>
  )
}

export default DownloadAllInvoicesPDFButton
