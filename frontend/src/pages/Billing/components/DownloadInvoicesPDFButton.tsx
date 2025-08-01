import {
  IHidratedGeneratedInvoices,
  InvoiceType,
  permissionRequests,
  ToastType,
} from '@smambu/lib.constants'
import { Button } from '@mui/material'
import { useRequestPDFArchiveGeneration } from 'hooks/pdfArchiveHooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'
import { trlb } from 'utilities'

interface IDownloadInvoicesPDFButtonProps {
  selectedInvoices: IHidratedGeneratedInvoices[]
  deselectFun: () => void
}

const DownloadInvoicesPDFButton: React.FC<IDownloadInvoicesPDFButtonProps> = ({
  selectedInvoices, deselectFun
}) => {
  const dispatch = useDispatch()
  const selectedInvoicesIds = selectedInvoices.map(invoice => invoice.invoiceId)

  const checkPermissions = useGetCheckPermission()
  const canDownloadBills = checkPermissions(permissionRequests.canDownloadBills)

  const requestArchiveGeneration = useRequestPDFArchiveGeneration()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    requestArchiveGeneration(selectedInvoicesIds)
    deselectFun()

    dispatch({
      type: GLOBAL_ACTION.ADD_TOAST,
      data: {
        type: ToastType.success,
        text: 'archiveRequestSent',
      },
    })
  }

  const prohibitedInvoicesSelected = selectedInvoices.some(invoice => {
    const anyBillProhibited = invoice.cases.some(currentCase => {
      const canDownload = checkPermissions(permissionRequests.canDownloadBill, {
        caseItem: currentCase,
      })

      return !canDownload
    })

    return anyBillProhibited ||
    invoice.type === InvoiceType.PC_MATERIALS ||
    !invoice.pdfRef
  })

  const disableButton = prohibitedInvoicesSelected || selectedInvoices.length === 0

  const buttonLabel = trlb('archiveSelectedInvoicesPDFLabel')

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

export default DownloadInvoicesPDFButton
