import React from 'react'
import { CaseForm, getCaseOpStandard, permissionRequests } from '@smambu/lib.constants'
import { Box, Grid, Accordion, Typography, AccordionDetails, AccordionSummary } from '@mui/material'
import { AccordionContainer, FormikGridTextField, Panel, SectionTitle, Space20, Space40 } from 'components/Commons'
import { FormikProps } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import { trlb } from 'utilities'
import TimestampSelector from '../TimestampSelector'
import { CaseIntraOpSection } from 'pages/OpStandardManagement/components/IntraOpSection'
import {
  BacteriologyContainer,
  BipolarContainer,
  CountControlContainer,
  DrainageContainer,
  HistologyContainer,
  MonopolarContainer,
  TourniquetContainer,
  XrayContainer,
} from '../intraOPContainers'
import SurgeryNotes from '../surgeryNotes'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DocumentsSection } from 'components/DocumentsSection'
import { useAppSelector } from 'store'
import { hasBillingErrors } from 'utilities/cases-opstandards'
const IntraOpTab = ({
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
  // eslint-disable-next-line max-len
  const canViewIntraOpDocumentation = checkPermission(permissionRequests.canViewIntraOpDocumentation)
  const canViewSurgeryTimestamps = checkPermission(permissionRequests.canViewSurgeryTimestamps)
  const canSetSurgeryTimestamps = checkPermission(permissionRequests.canSetSurgeryTimestamps)
  const canEditSurgeryTimestamps = checkPermission(permissionRequests.canEditSurgeryTimestamps)
  const canViewPatientTimestamps = checkPermission(permissionRequests.canViewPatientTimestamps)
  const canSetPatientTimestamps = checkPermission(permissionRequests.canSetPatientTimestamps)
  const canEditPatientTimestamps = checkPermission(permissionRequests.canEditPatientTimestamps)

  const canViewIntraOPNotes = checkPermission(permissionRequests.canViewIntraOpNotes)
  const canViewSurgeryNotes = checkPermission(permissionRequests.canViewSurgeryNotes)

  const canEditIntraopNotes = checkPermission(permissionRequests.canEditIntraopNotes)

  const canEditSurgeryNotes = checkPermission(permissionRequests.canEditSurgeryNotes)

  // eslint-disable-next-line max-len
  const canDownloadIntraOpDocuments = checkPermission(permissionRequests.canDownloadIntraOpDocuments)
  const canUploadIntraOpDocuments = checkPermission(permissionRequests.canUploadIntraOpDocuments)
  const canViewIntraOpDocuments = checkPermission(permissionRequests.canViewIntraOpDocuments)

  // eslint-disable-next-line max-len
  const canEditIntraOpDocumentation = checkPermission(permissionRequests.canEditIntraOpDocumentation)

  const contracts = useAppSelector(state => state.contracts)
  const opStandard = getCaseOpStandard({ caseForm: form.values, contracts })

  const necessaryForBuildingLabel = trlb('case_tab_billing_field_necessary_for_billing')
  const surgeryEndTimestampWarning = hasBillingErrors(warningFields, 'timestamps.surgeryEndTimestamp', true) ? necessaryForBuildingLabel : ''

  // eslint-disable-next-line max-len
  const handleIntraOpNotes = async (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    await form.setFieldValue('intraOpSection.additionalNotes', e.target.value)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <SectionTitle text={trlb('case_tab_intraOp')} />
      <Space20 />
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }}>
        <Space20 />
        <Panel
          sx={{
            justifyContent: 'center',
            display: 'flex',
          }}
        >
          <FormikGridTextField
            label={trlb('case_tab_intraOp_side')}
            xs={4}
            disabled={true}
            form={form}
            section='surgerySection'
            errors={form.errors.surgerySection}
            values={form.values.surgerySection}
            touched={form.touched.surgerySection}
            name='side'
          />
        </Panel>
        {canViewSurgeryTimestamps && canViewIntraOpDocumentation && (
          <Panel
            sx={{
              display: 'flex',
              marginTop: '20px',
            }}
          >
            <TimestampSelector
              value={form.values.timestamps.surgeryStartTimestamp}
              canSetTimestamp={canSetSurgeryTimestamps && canEditIntraOpDocumentation}
              canEditTimestamp={canEditSurgeryTimestamps && canEditIntraOpDocumentation}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.surgeryStartTimestamp', newValue)}
              timestampLabel={trlb('case_tab_intraOp_surgery_start_timestamp')}
              timeStampSetLabel={trlb('case_tab_intraOp_set_surgery_start_timestamp')}
              xs={4}
            />
            <TimestampSelector
              value={form.values.timestamps.cutTimestap}
              canSetTimestamp={canSetSurgeryTimestamps && canEditIntraOpDocumentation}
              canEditTimestamp={canEditSurgeryTimestamps && canEditIntraOpDocumentation}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.cutTimestap', newValue)}
              timestampLabel={trlb('case_tab_intraOp_cutTimestamp')}
              timeStampSetLabel={trlb('case_tab_intraOp_set_cutTimestamp')}
              xs={4}
            />
            <TimestampSelector
              value={form.values.timestamps.surgeryEndTimestamp}
              canSetTimestamp={canSetSurgeryTimestamps && canEditIntraOpDocumentation}
              canEditTimestamp={canEditSurgeryTimestamps && canEditIntraOpDocumentation}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.surgeryEndTimestamp', newValue)}
              timestampLabel={trlb('case_tab_intraOp_surgery_finish_timestamp')}
              timeStampSetLabel={trlb('case_tab_intraOp_set_surgery_finish_timestamp')}
              xs={4}
              warning={surgeryEndTimestampWarning}
            />
          </Panel>
        )}
        {canViewIntraOpDocumentation && canViewPatientTimestamps && (
          <Panel
            sx={{
              display: 'flex',
              marginTop: '20px',
            }}
          >
            <TimestampSelector
              value={form.values.timestamps.roomEnterTimestamp}
              canSetTimestamp={canSetPatientTimestamps && canEditIntraOpDocumentation}
              canEditTimestamp={canEditPatientTimestamps && canEditIntraOpDocumentation}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.roomEnterTimestamp', newValue)}
              timestampLabel={trlb('case_tab_intraOp_roomEnterTimestamp')}
              timeStampSetLabel={trlb('case_tab_intraOp_set_roomEnterTimestamp')}
              xs={4}
            />
            <TimestampSelector
              value={form.values.timestamps.readyForRecoveryTimestamp}
              canSetTimestamp={canSetPatientTimestamps && canEditIntraOpDocumentation}
              canEditTimestamp={canEditPatientTimestamps && canEditIntraOpDocumentation}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.readyForRecoveryTimestamp', newValue)}
              timestampLabel={trlb('case_tab_intraOP_readyForRecoveryTimestamp')}
              timeStampSetLabel={trlb('case_tab_intraOP_set_readyForRecoveryTimestamp')}
              xs={4}
            />
            <TimestampSelector
              value={form.values.timestamps.roomExitTimestmap}
              canSetTimestamp={canSetPatientTimestamps && canEditIntraOpDocumentation}
              canEditTimestamp={canEditPatientTimestamps && canEditIntraOpDocumentation}
              edit={edit}
              onChange={newValue => form.setFieldValue('timestamps.roomExitTimestmap', newValue)}
              timestampLabel={trlb('case_tab_intraOp_roomExitTimestamp')}
              timeStampSetLabel={trlb('case_tab_intraOp_set_roomExitTimestamp')}
              xs={4}
            />
          </Panel>
        )}
        {canViewIntraOpDocumentation && (
          <>
            <Space20 />
            <CaseIntraOpSection
              form={form}
              edit={edit && canEditIntraOpDocumentation}
              formPath='intraOpSection.'
              caseDetails={true}
              warningFields={warningFields}
              showDocumentationWarnings={showDocumentationWarnings}
              showBillingWarning={showBillingWarning}
            />
          </>
        )}
        {canViewIntraOpDocumentation &&
          (opStandard?.intraOpSection?.tourniquet?.blutleere?.required ||
            opStandard?.intraOpSection?.tourniquet?.tourniquet?.required) && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('op_standard_tourniquet')}
              accordionContent={
                <TourniquetContainer form={form}
                  edit={edit && canEditIntraOpDocumentation}
                  opStandard={opStandard} />
              }
            />
          </Grid>
        )}
        {canViewIntraOpDocumentation && opStandard?.intraOpSection?.x_ray?.required && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('op_standard_x_ray')}
              accordionContent={<XrayContainer form={form}
                edit={edit && canEditIntraOpDocumentation} />}
            />
          </Grid>
        )}
        {canViewIntraOpDocumentation && opStandard?.intraOpSection?.drainage?.required && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('op_standard_drainage')}
              accordionContent={<DrainageContainer form={form}
                edit={edit && canEditIntraOpDocumentation} />}
            />
          </Grid>
        )}
        {canViewIntraOpDocumentation && opStandard?.intraOpSection?.monopolar?.required && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('op_standard_monopolar')}
              accordionContent={<MonopolarContainer form={form}
                edit={edit && canEditIntraOpDocumentation} />}
            />
          </Grid>
        )}
        {canViewIntraOpDocumentation && opStandard?.intraOpSection?.bipolar?.required && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('op_standard_bipolar')}
              accordionContent={<BipolarContainer form={form}
                edit={edit && canEditIntraOpDocumentation} />}
            />
          </Grid>
        )}
        {canViewIntraOpDocumentation && opStandard?.intraOpSection?.histology?.required && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('op_standard_histology')}
              accordionContent={<HistologyContainer form={form}
                edit={edit && canEditIntraOpDocumentation} />}
            />
          </Grid>
        )}
        {canViewIntraOpDocumentation && opStandard?.intraOpSection?.bacteriology?.required && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('op_standard_bacteriology')}
              accordionContent={<BacteriologyContainer form={form}
                edit={edit && canEditIntraOpDocumentation} />}
            />
          </Grid>
        )}
        {canViewIntraOpDocumentation && (
          <Grid item xs={12}>
            <AccordionContainer
              text={trlb('case_tab_intraOP_CountControl')}
              accordionContent={<CountControlContainer form={form}
                edit={edit && canEditIntraOpDocumentation} />}
            />
          </Grid>
        )}
        {(canViewIntraOPNotes || canViewSurgeryNotes) && (
          <>
            <SectionTitle text={trlb('case_tab_intraOP_notes')} />
            <Space20 />
            <SurgeryNotes
              readOnlyText={form.values.intraOpSection?.notes}
              text={form.values.intraOpSection?.additionalNotes}
              handleTextChange={handleIntraOpNotes}
              edit={edit && (canEditIntraopNotes || canEditSurgeryNotes)}
            />
          </>
        )}
        <Space40 />
        {canViewIntraOpDocuments && (
          <Grid item xs={12}>
            <Panel>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
                  <Typography>{trlb('case_tab_checkin_documents')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {form.values.intraOpUploads?.length > 0 ||
                    form.values.intraOpDocumentsToUpload?.length > 0 ||
                    edit
                    ? (
                      <DocumentsSection
                        form={form}
                        uploadsField='intraOpUploads'
                        documentsToUploadField='intraOpDocumentsToUpload'
                        edit={edit && canUploadIntraOpDocuments}
                        canDownloadDocuments={canDownloadIntraOpDocuments}
                        canViewDocuments={canViewIntraOpDocuments}
                      />
                    )
                    : (
                      <Typography variant='body2'>{trlb('case_tab_checkin_documents_no_files')}</Typography>
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

export default IntraOpTab
