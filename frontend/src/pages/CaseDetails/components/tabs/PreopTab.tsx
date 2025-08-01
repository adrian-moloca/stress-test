import React from 'react'
import { CaseForm, permissionRequests } from '@smambu/lib.constants'
import { Box, Grid } from '@mui/material'
import { SectionTitle, Space20 } from 'components/Commons'
import { FormikProps } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import { trlb } from 'utilities'
import TimestampSelector from '../TimestampSelector'
import SurgeryNotes from '../surgeryNotes'
import CasePreOpSection from '../CasePreOpSection'

const PreopTab = ({
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
  const canViewPreopTimestamps = checkPermission(permissionRequests.canViewPreopTimestamps)
  const canEditPreopTimestamps = checkPermission(permissionRequests.canEditPreopTimestamps)
  const canSetPreopTimestamps = checkPermission(permissionRequests.canSetPreopTimestamps)
  const canViewPreopDocumentation = checkPermission(permissionRequests.canViewPreopDocumentation)
  const canViewPreOpNotes = checkPermission(permissionRequests.canViewPreOpNotes)
  const canViewSurgeryNotes = checkPermission(permissionRequests.canViewSurgeryNotes)
  const canEditPreopDocumentation = checkPermission(permissionRequests.canEditPreopDocumentation)
  const canEditPreopNotes = checkPermission(permissionRequests.canEditPreopNotes)
  const canEditSurgeryNotes = checkPermission(permissionRequests.canEditSurgeryNotes)

  const handlePreOpNotes = async (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    await form.setFieldValue('preOpSection.additionalNotes', e.target.value)
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
      <SectionTitle text={trlb('case_tab_preOp')} />
      <Space20 />
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        {canViewPreopTimestamps && (
          <>
            <TimestampSelector
              value={form.values.timestamps.preopStartedTimestamp}
              canSetTimestamp={canSetPreopTimestamps}
              canEditTimestamp={canEditPreopTimestamps}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.preopStartedTimestamp', newValue)}
              timestampLabel={trlb('case_tab_preop_start_timestamp')}
              timeStampSetLabel={trlb('case_tab_preop_set_start_timestamp')}
              xs={4}
            />
            <TimestampSelector
              value={form.values.timestamps.preopFinishedTimestamp}
              canSetTimestamp={canSetPreopTimestamps}
              canEditTimestamp={canEditPreopTimestamps}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.preopFinishedTimestamp', newValue)}
              timestampLabel={trlb('case_tab_preop_finish_timestamp')}
              timeStampSetLabel={trlb('case_tab_preop_set_finish_timestamp')}
              xs={4}
            />
          </>
        )}
        <Space20 />
        {canViewPreopDocumentation && (
          <CasePreOpSection
            form={form}
            formPath='preOpSection.'
            caseDetails={true}
            edit={edit && canEditPreopDocumentation}
            warningFields={warningFields}
            showDocumentationWarnings={showDocumentationWarnings}
            showBillingWarning={showBillingWarning}
          />
        )}
        {(canViewPreOpNotes || canViewSurgeryNotes) && (
          <>
            <SectionTitle text={trlb('case_tab_preop_notes')} />
            <Space20 />
            <SurgeryNotes
              readOnlyText={form.values.preOpSection?.notes}
              text={form.values.preOpSection?.additionalNotes}
              handleTextChange={handlePreOpNotes}
              edit={edit && (canEditPreopNotes || canEditSurgeryNotes)}
            />
          </>
        )}
      </Grid>
    </Box>
  )
}

export default PreopTab
