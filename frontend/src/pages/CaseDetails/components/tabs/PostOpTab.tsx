import React from 'react'
import { CaseForm, permissionRequests } from '@smambu/lib.constants'
import { FormikProps } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import { Box, Grid } from '@mui/material'
import TimestampSelector from '../TimestampSelector'
import { SectionTitle, Space20 } from 'components/Commons'
import SurgeryNotes from '../surgeryNotes'
import CasePostOpSection from '../CasePostOpSection'
import { trlb } from 'utilities'

const PostOpTab = ({
  form,
  edit,
  warningFields,
  showDocumentationWarnings,
  showBillingWarning,
}: {
  form: FormikProps<CaseForm>
  edit: boolean
  warningFields: string[]
  showDocumentationWarnings?: boolean
  showBillingWarning?: boolean
}) => {
  const checkPermission = useGetCheckPermission()
  const canViewPostOpTimestamps = checkPermission(permissionRequests.canViewPostOpTimestamps)
  const canSetPostOpTimestamps = checkPermission(permissionRequests.canSetPostOpTimestamps)
  const canEditPostOpTimestamps = checkPermission(permissionRequests.canEditPostOpTimestamps)
  const canViewPostOpDocumentation = checkPermission(permissionRequests.canViewPostOpDocumentation)
  const canEditPostOpDocumentation = checkPermission(permissionRequests.canEditPostOpDocumentation)
  const canViewSurgeryNotes = checkPermission(permissionRequests.canViewSurgeryNotes)
  const canEditSurgeryNotes = checkPermission(permissionRequests.canEditSurgeryNotes)
  const canViewPostOpNotes = checkPermission(permissionRequests.canViewPostOpNotes)
  const canEditPostOpNotes = checkPermission(permissionRequests.canEditPostOpNotes)

  // eslint-disable-next-line max-len
  const handlePostOpNotes = async (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    await form.setFieldValue('postOpSection.additionalNotes', e.target.value)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        paddingX: 2,
      }}
    >
      <SectionTitle text={trlb('case_tab_postOp')} />
      <Space20 />
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        {canViewPostOpTimestamps && (
          <>
            <TimestampSelector
              value={form.values.timestamps.postOpStartedTimestap}
              canSetTimestamp={canSetPostOpTimestamps}
              canEditTimestamp={canEditPostOpTimestamps}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.postOpStartedTimestap', newValue)}
              timestampLabel={trlb('case_tab_postOp_postOpStarted_timestamp')}
              timeStampSetLabel={trlb('case_tab_postOp_set_postOpStarted_timestamp')}
              xs={6}
            />
            <TimestampSelector
              value={form.values.timestamps.postOpFinishedTimestap}
              canSetTimestamp={canSetPostOpTimestamps}
              canEditTimestamp={canEditPostOpTimestamps}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.postOpFinishedTimestap', newValue)}
              timestampLabel={trlb('case_tab_postOp_postOpFinished_timestamp')}
              timeStampSetLabel={trlb('case_tab_postOp_set_postOpFinished_timestamp')}
              xs={6}
            />
            <TimestampSelector
              value={form.values.timestamps.arrivedInRecoveryRoomTimestamp}
              canSetTimestamp={canSetPostOpTimestamps}
              canEditTimestamp={canEditPostOpTimestamps}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.arrivedInRecoveryRoomTimestamp', newValue)}
              timestampLabel={trlb('case_tab_postOp_arrivedInRecoveryRoom_timestamp')}
              timeStampSetLabel={trlb('case_tab_postOp_set_arrivedInRecoveryRoom_timestamp')}
              xs={6}
            />
            <TimestampSelector
              value={form.values.timestamps.readyForReleaseTimestamp}
              canSetTimestamp={canSetPostOpTimestamps}
              canEditTimestamp={canEditPostOpTimestamps}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.readyForReleaseTimestamp', newValue)}
              timestampLabel={trlb('case_tab_postOP_readyForRelease_timestamp')}
              timeStampSetLabel={trlb('case_tab_postOP_set_readyForRelease_timestamp')}
              xs={6}
            />
          </>
        )}
        <Space20 />
        {canViewPostOpDocumentation && (
          <CasePostOpSection
            form={form}
            edit={edit && canEditPostOpDocumentation}
            formPath='postOpSection.'
            caseDetails={true}
            warningFields={warningFields}
            showDocumentationWarnings={showDocumentationWarnings}
            showBillingWarning={showBillingWarning}
          />
        )}
        {(canViewPostOpNotes || canViewSurgeryNotes) && (
          <>
            <SectionTitle text={trlb('case_tab_postOp_notes')} />
            <Space20 />
            <SurgeryNotes
              readOnlyText={form.values.postOpSection?.notes}
              text={form.values.postOpSection?.additionalNotes}
              handleTextChange={handlePostOpNotes}
              edit={edit && (canEditPostOpNotes || canEditSurgeryNotes)}
            />
          </>
        )}
      </Grid>
    </Box>
  )
}

export default PostOpTab
