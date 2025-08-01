import {
  CaseForm,
  permissionRequests,
} from '@smambu/lib.constants'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Typography,
} from '@mui/material'
import { Panel, SectionTitle } from 'components/Commons'
import { FormikProps } from 'formik'
import React, { FunctionComponent } from 'react'
import { trlb } from 'utilities'
import { useGetCheckPermission } from 'hooks/userPermission'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DocumentsSection } from 'components/DocumentsSection'
import TimestampSelector from '../TimestampSelector'
import { PaymentReceiptContainer } from '../chekoutTabParts'

interface CheckoutTabProps {
  form: FormikProps<CaseForm>
  edit: boolean
  canEditPaymentContainer: boolean
}
const CheckoutTab: FunctionComponent<CheckoutTabProps> = ({
  form,
  edit,
  canEditPaymentContainer
}) => {
  const checkPermision = useGetCheckPermission()
  const canViewCheckoutTimestamp = checkPermision(permissionRequests.canViewCheckoutTimestamp)
  const canSetCheckoutTimestamp = checkPermision(permissionRequests.canSetCheckoutTimestamp)
  const canEditCheckoutTimestamp = checkPermision(permissionRequests.canEditCheckoutTimestamp)
  const canViewCheckoutDocuments = checkPermision(permissionRequests.canViewCheckoutDocuments)
  const canUploadCheckoutDocumets = checkPermision(permissionRequests.canUploadCheckoutDocumets)
  // eslint-disable-next-line max-len
  const canDownloadCheckoutDocuments = checkPermision(permissionRequests.canDownloadCheckoutDocuments)
  const canViewReceipts = checkPermision(permissionRequests.canViewReceipts, {
    caseItem: form.values,
  })

  // UR TODO: get invoices to pay directly to clinic from UR
  const invoicesToPayDirectly = []

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <SectionTitle text={trlb('case_tab_checkout')} />
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        {canViewCheckoutTimestamp && (
          <TimestampSelector
            value={form.values.timestamps.dischargedTimestamp}
            canSetTimestamp={canSetCheckoutTimestamp}
            canEditTimestamp={canEditCheckoutTimestamp}
            edit={edit}
            onChange={newValue => form.setFieldValue('timestamps.dischargedTimestamp', newValue)}
            timestampLabel={trlb('case_tab_checkout_time')}
            timeStampSetLabel={trlb('case_tab_checkout_setCheckout')}
            xs={8}
          />
        )}
        {canViewReceipts && invoicesToPayDirectly.length
          ? (
            <Grid item xs={8}>
              <PaymentReceiptContainer form={form} edit={canEditPaymentContainer} />
            </Grid>
          )
          : null}
        {canViewCheckoutDocuments && (
          <Grid item xs={8}>
            <Panel>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
                  <Typography>{trlb('case_tab_checkout_documents')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {form.values?.checkoutUploads?.length > 0 ||
                  form.values.checkoutDocumentsToUpload?.length > 0 ||
                  edit
                    ? (
                      <DocumentsSection
                        form={form}
                        uploadsField='checkoutUploads'
                        documentsToUploadField='checkoutDocumentsToUpload'
                        edit={edit && canUploadCheckoutDocumets}
                        canDownloadDocuments={canDownloadCheckoutDocuments}
                        canViewDocuments={canViewCheckoutDocuments}
                      />
                    )
                    : (
                      <Typography variant='body2'>{trlb('case_tab_checkout_documents_no_files')}</Typography>
                    )}
                </AccordionDetails>
              </Accordion>
            </Panel>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default CheckoutTab
