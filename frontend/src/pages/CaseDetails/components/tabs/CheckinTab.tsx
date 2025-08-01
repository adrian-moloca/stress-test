import {
  CaseForm,
  CaseStatus,
  caseStatusOrder,
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
import React, { FunctionComponent, useState } from 'react'
import { trlb } from 'utilities'
import { useGetCheckPermission } from 'hooks/userPermission'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DocumentsSection } from 'components/DocumentsSection'
import TimestampSelector from '../TimestampSelector'
import { ChangeStatusAlert } from '../checkinTabComponents'
import { CostEstimateContainer, PaymentReceiptContainer } from '../CheckinTabParts'

interface CheckinTabProps {
  form: FormikProps<CaseForm>
  edit: boolean
  patientAssociationButtonClicked: boolean
  canEditPaymentContainer: boolean
}
const CheckinTab: FunctionComponent<CheckinTabProps> = ({
  form,
  edit,
  patientAssociationButtonClicked,
  canEditPaymentContainer,
}) => {
  const checkPermision = useGetCheckPermission()
  const [changeStatusTimestamp, setChangeStatusTimestamp] = useState<Date | null>(null)
  const canViewCheckinTimestamp = checkPermision(permissionRequests.canViewCheckinTimestamp)
  const canSetCheckinTimestamp = checkPermision(permissionRequests.canSetCheckinTimestamp)
  const canEditCheckinTimestamp = checkPermision(permissionRequests.canEditCheckinTimestamp)
  const canViewCheckinDocuments = checkPermision(permissionRequests.canViewCheckinDocuments)
  const canUploadCheckinDocuments = checkPermision(permissionRequests.canUploadCheckinDocuments)
  const canDownloadCheckinDocuments = checkPermision(permissionRequests.canDownloadCheckinDocuments)
  const canViewCostEstimates = checkPermision(permissionRequests.canViewCostEstimates, {
    caseItem: form.values,
  })
  const canViewReceipts = checkPermision(permissionRequests.canViewReceipts, {
    caseItem: form.values,
  })

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <SectionTitle text={trlb('checkInTab_title')} />
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        <Grid item xs={8}>
          {canViewCheckinTimestamp && (
            <Panel
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                height: '150px',
              }}
            >
              <TimestampSelector
                value={form.values.timestamps.patientArrivalTimestamp}
                canSetTimestamp={canSetCheckinTimestamp}
                canEditTimestamp={canEditCheckinTimestamp}
                edit={!!(edit && form.values?.operatingRoomId && form.values?.patientRef)}
                onChange={newValue => {
                  if (
                    form.values.timestamps.patientArrivalTimestamp == null &&
                    (form.values.status !== CaseStatus.CONFIRMED ||
                      (form.values.status !== CaseStatus.CONFIRMED &&
                        !caseStatusOrder.includes(form.values.status)))
                  ) {
                    setChangeStatusTimestamp(newValue)
                    return
                  }
                  form.setFieldValue('timestamps.patientArrivalTimestamp', newValue)
                }}
                timestampLabel={trlb('case_tab_checkin_time')}
                timeStampSetLabel={trlb('case_tab_checkin_setCheckin')}
                xs={8}
              />
              {!form.values.patientRef &&
                canEditCheckinTimestamp &&
                canSetCheckinTimestamp &&
                !form.values.timestamps.patientArrivalTimestamp && (
                <Typography variant='body2' sx={{ color: 'red', mt: 1 }}>
                  {trlb('case_tab_checkin_associate_patient_helper_text')}
                </Typography>
              )}
              {!form.values?.operatingRoomId &&
                canEditCheckinTimestamp &&
                canSetCheckinTimestamp &&
                !form.values.timestamps.patientArrivalTimestamp && (
                <Typography variant='body2' sx={{ color: 'red', mt: 1 }}>
                  {trlb('case_tab_checkin_assign_room_helper_text')}
                </Typography>
              )}
            </Panel>
          )}
        </Grid>
        {canViewCostEstimates && (
          <Grid item xs={8}>
            <CostEstimateContainer
              form={form}
              edit={edit}
              patientAssociationButtonClicked={patientAssociationButtonClicked}
            />
          </Grid>
        )}
        {canViewReceipts && (
          <Grid item xs={8}>
            <PaymentReceiptContainer form={form} edit={canEditPaymentContainer} />
          </Grid>
        )}
        {canViewCheckinDocuments && (
          <Grid item xs={8}>
            <Panel>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
                  <Typography>{trlb('case_tab_checkin_documents')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {form.values.checkinUploads?.length > 0 ||
                  form.values.checkinDocumentsToUpload?.length > 0 ||
                  edit
                    ? (
                      <DocumentsSection
                        form={form}
                        uploadsField='checkinUploads'
                        documentsToUploadField='checkinDocumentsToUpload'
                        edit={edit && canUploadCheckinDocuments}
                        canDownloadDocuments={canDownloadCheckinDocuments}
                        canViewDocuments={canViewCheckinDocuments}
                      />
                    )
                    : (
                      <Typography variant='body2'>{trlb('case_tab_checkin_documents_no_files')}</Typography>
                    )}
                </AccordionDetails>
              </Accordion>
            </Panel>
            <ChangeStatusAlert
              open={Boolean(changeStatusTimestamp)}
              onClose={() => setChangeStatusTimestamp(null)}
              onConfirm={() => {
                form.setFieldValue('timestamps.patientArrivalTimestamp', changeStatusTimestamp)
                setChangeStatusTimestamp(null)
              }}
              currentStatus={form.values?.status}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default CheckinTab
