import React from 'react'
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { CaseForm, OpStandardAnesthesiaRow, getFullName, permissionRequests } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import { FormikProps } from 'formik'
import { useLoggedUserIsAnesthesiologist } from 'hooks/userHooks'
import { useAppSelector } from 'store'
import { Panel, SectionTitle, Space10, Space20 } from 'components/Commons'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TimestampSelector from './TimestampSelector'
import SurgeryNotes from './surgeryNotes'
import AnesthesiaRow from 'pages/OpStandardManagement/components/AnesthesiaRow'
import { Add } from '@mui/icons-material'
import { TextIconButton } from 'components/Buttons'
import { trlb } from 'utilities'

export const AnesthesiologistsList = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const checkPermission = useGetCheckPermission()
  const canAssignMySelfAsAnesthesiologistInCase = checkPermission(
    permissionRequests.canAssignMySelfAsAnesthesiologistInCase,
  )

  const users = useAppSelector(state => state.users)
  const loggedUserId = useAppSelector(state => state.auth.user.id)
  const imAnesthesiologist = useLoggedUserIsAnesthesiologist()

  const assignMyself = () => {
    form.setFieldValue('anesthesiologistsId', [...form.values.anesthesiologistsId, loggedUserId])
  }

  return (
    <Grid item xs={6}>
      <Box display={'flex'} flexDirection={'column'}>
        <Panel>
          <Typography variant='h5'> {trlb('case_tab_anesthesia_anesthesiologists')} </Typography>
          {form.values.anesthesiologistsId.map((userId: string) => (
            <Box key={userId}>
              {getFullName(users[userId], true)}
            </Box>
          ))}
          {form.values?.anesthesiologistsId?.length === 0 && (
            <Typography variant='body2'>{trlb('case_tab_anesthesia_anesthesiologists_notAssignedYet')}</Typography>
          )}
          {!form.values?.anesthesiologistsId.includes(loggedUserId) &&
            edit &&
            imAnesthesiologist &&
            canAssignMySelfAsAnesthesiologistInCase && (
            <Button
              variant='contained'
              color='primary'
              size='small'
              onClick={assignMyself}
              sx={{
                mt: 2,
              }}
            >
              {trlb('case_tab_anesthesia_assignMyselfAsAnesthesiologist')}
            </Button>
          )}
        </Panel>
      </Box>
    </Grid>
  )
}

export const AnesthesiaNotes = ({ form, edit }: { form: FormikProps<CaseForm>; edit: boolean }) => {
  const handlePreOpNotes = async (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    await form.setFieldValue('preOpSection.additionalNotes', e.target.value)
  }

  // eslint-disable-next-line max-len
  const handleIntraOpNotes = async (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    await form.setFieldValue('intraOpSection.additionalNotes', e.target.value)
  }

  // eslint-disable-next-line max-len
  const handlePostOpNotes = async (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    await form.setFieldValue('postOpSection.additionalNotes', e.target.value)
  }

  return (
    <Grid item xs={12}>
      <SectionTitle text={trlb('case_tab_preop_notes')} />
      <Space20 />
      <SurgeryNotes
        readOnlyText={form.values.preOpSection?.notes}
        text={form.values.preOpSection?.additionalNotes}
        handleTextChange={handlePreOpNotes}
        edit={edit}
      />
      <Space20 />
      <SectionTitle text={trlb('case_tab_intraOP_notes')} />
      <Space20 />
      <SurgeryNotes
        readOnlyText={form.values.intraOpSection?.notes}
        text={form.values.intraOpSection?.additionalNotes}
        handleTextChange={handleIntraOpNotes}
        edit={edit}
      />
      <Space20 />
      <SectionTitle text={trlb('case_tab_postOp_notes')} />
      <Space20 />
      <SurgeryNotes
        readOnlyText={form.values.postOpSection?.notes}
        text={form.values.postOpSection?.additionalNotes}
        handleTextChange={handlePostOpNotes}
        edit={edit}
      />
    </Grid>
  )
}

export const PatientTimestampsContainer = ({
  form,
  edit,
  warningFields,
}: {
  form: FormikProps<CaseForm>
  edit: boolean
  warningFields: string[]
}) => {
  const checkPermission = useGetCheckPermission()
  const canEditPatientTimestamps = checkPermission(permissionRequests.canEditPatientTimestamps)
  const canSetPatientTimestamps = checkPermission(permissionRequests.canSetPatientTimestamps)
  return (
    <Grid item xs={12}>
      <Panel>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
            <Typography>{trlb('case_tab_anesthesia_patient')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <TimestampSelector
                value={form.values.timestamps.roomEnterTimestamp}
                canSetTimestamp={canSetPatientTimestamps}
                canEditTimestamp={canEditPatientTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.roomEnterTimestamp', newValue)}
                timestampLabel={trlb('case_tab_intraOp_roomEnterTimestamp')}
                timeStampSetLabel={trlb('case_tab_intraOp_set_roomEnterTimestamp')}
                warning={
                  warningFields.includes('timestamps.roomEnterTimestamp')
                    ? trlb('case_tab_billing_field_necessary_for_billing')
                    : ''
                }
                lg={4}
                md={12}
                xs={12}
              />
              <TimestampSelector
                value={form.values.timestamps.readyForRecoveryTimestamp}
                canSetTimestamp={canSetPatientTimestamps}
                canEditTimestamp={canEditPatientTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.readyForRecoveryTimestamp', newValue)}
                timestampLabel={trlb('case_tab_intraOP_readyForRecoveryTimestamp')}
                timeStampSetLabel={trlb('case_tab_intraOP_set_readyForRecoveryTimestamp')}
                lg={4}
                md={12}
                xs={12}
              />
              <TimestampSelector
                value={form.values.timestamps.roomExitTimestmap}
                canSetTimestamp={canSetPatientTimestamps}
                canEditTimestamp={canEditPatientTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.roomExitTimestmap', newValue)}
                timestampLabel={trlb('case_tab_intraOp_roomExitTimestamp')}
                timeStampSetLabel={trlb('case_tab_intraOp_set_roomExitTimestamp')}
                warning={
                  warningFields.includes('timestamps.roomExitTimestmap')
                    ? trlb('case_tab_billing_field_necessary_for_billing')
                    : ''
                }
                lg={4}
                md={12}
                xs={12}
              />
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Panel>
    </Grid>
  )
}

export const AnesthesiaTimestampsContainer = ({
  form,
  edit,
  warningFields,
}: {
  form: FormikProps<CaseForm>
  edit: boolean
  warningFields: string[]
}) => {
  const checkPermission = useGetCheckPermission()
  // eslint-disable-next-line max-len
  const canEditAnesthesiaTimestamps = checkPermission(permissionRequests.canEditAnesthesiaTimestamps)
  const canSetAnesthesiaTimestamps = checkPermission(permissionRequests.canSetAnesthesiaTimestamps)
  return (
    <Grid item xs={12}>
      <Panel>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
            <Typography>{trlb('case_tab_anesthesia_anesthesia')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <TimestampSelector
                value={form.values.timestamps.anesthesiologistOnSiteTimestamp}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.anesthesiologistOnSiteTimestamp', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_anesthesiologistOnSite')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_anesthesiologistOnSite')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
              />
              <TimestampSelector
                value={form.values.timestamps.anesthesiaStartedTimestamp}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.anesthesiaStartedTimestamp', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_start_timestamp')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_start_timestamp')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
              />
              <TimestampSelector
                value={form.values.timestamps.intubationTimestap}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.intubationTimestap', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_intubation_timestamp')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_intubation_timestamp')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
              />
              <TimestampSelector
                value={form.values.timestamps.releaseForSurgeryTimestap}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.releaseForSurgeryTimestap', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_releasedForSurgery_timestamp')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_releasedForSurgery_timestamp')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
                warning={
                  warningFields.includes('timestamps.releaseForSurgeryTimestap')
                    ? trlb('case_tab_billing_field_necessary_for_billing')
                    : ''
                }
              />
              <TimestampSelector
                value={form.values.timestamps.cutTimestap}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.cutTimestap', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_cut_timestamp')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_cut_timestamp')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
              />
              <TimestampSelector
                value={form.values.timestamps.endOfSurgicalMeasuresTimestamp}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.endOfSurgicalMeasuresTimestamp', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_endOfSurgicalMeasures_timestamp')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_endOfSurgicalMeasures_timestamp')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
                warning={
                  warningFields.includes('timestamps.endOfSurgicalMeasuresTimestamp')
                    ? trlb('case_tab_billing_field_necessary_for_billing')
                    : ''
                }
              />
              <TimestampSelector
                value={form.values.timestamps.extubationTimestap}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.extubationTimestap', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_extubation_timestamp')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_extubation_timestamp')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
              />
              <TimestampSelector
                value={form.values.timestamps.anesthesiaFinishedTimestap}
                canSetTimestamp={canSetAnesthesiaTimestamps}
                canEditTimestamp={canEditAnesthesiaTimestamps}
                edit={edit}
                onChange={newValue => form.setFieldValue('timestamps.anesthesiaFinishedTimestap', newValue)}
                timestampLabel={trlb('case_tab_anesthesia_finish_timestamp')}
                timeStampSetLabel={trlb('case_tab_anesthesia_set_finish_timestamp')}
                xs={12}
                md={12}
                lg={6}
                xl={3}
              />
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Panel>
    </Grid>
  )
}

export const AnesthesiaTypesContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const deleteAnesthesiaRow = (index: number) => {
    const anesthesiaList = form.values.anesthesiaSection?.anesthesiaList
    form.setFieldValue(
      'anesthesiaSection.anesthesiaList',
      anesthesiaList.filter((_: any, _index: number) => _index !== index),
    )
  }

  const addAnesthesiaRow = () => {
    const anesthesiaList = form.values.anesthesiaSection?.anesthesiaList
    form.setFieldValue('anesthesiaSection.anesthesiaList', [...anesthesiaList, { anesthesiaType: '' }])
  }

  const suggestedAnesthesiae = form.values.anesthesiaSection.suggestedAnesthesiaList

  return (
    <Grid item xs={6}>
      <SectionTitle text={trlb('anesthesia_type')} />
      <Space10 />
      {(form.values.anesthesiaSection?.anesthesiaList || []).map(
        (anesthesiaRow: OpStandardAnesthesiaRow, index: number) => (
          <AnesthesiaRow
            key={index}
            form={form}
            edit={edit}
            index={index}
            deleteAnesthesiaRow={deleteAnesthesiaRow}
            anesthesiaRow={anesthesiaRow}
            errors={form.errors?.anesthesiaSection?.anesthesiaList?.[index]}
            section='anesthesiaSection.'
            showSide
            suggestedAnesthesiae={suggestedAnesthesiae}
          />
        ),
      )}
      {!edit && !form.values.anesthesiaSection?.anesthesiaList?.length && (
        <Typography sx={{ width: '100%', textAlign: 'center' }} variant='body1'>
          {trlb('anesthesia_noTypesSelected_warning')}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {edit && (
          <TextIconButton
            icon={<Add />}
            text={trlb('add_anesthesia')}
            variant='outlined'
            onClick={() => addAnesthesiaRow()}
          />
        )}
        {typeof form.errors.anesthesiaSection?.anesthesiaList === 'string' && (
          <Typography sx={{ ml: 2 }} variant='caption' color='error'>
            {trlb(String(form.errors.anesthesiaSection?.anesthesiaList))}
          </Typography>
        )}
      </Box>
      <Space20 />
    </Grid>
  )
}

export const ChangeAnesthesiologistOpStandardAlert = ({
  open,
  handleClose,
  handleConfirm,
}: {
  open: boolean
  handleClose: () => void
  handleConfirm: () => Promise<any>
}) => {
  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby='responsive-dialog-title'>
      <DialogTitle id='responsive-dialog-title'>
        {trlb('case_tab_anesthesia_changeAnesthesiologistOpStandardAlert_title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{trlb('case_tab_anesthesia_changeAnesthesiologistOpStandardAlert')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose}>
          {trlb('commons_cancel')}
        </Button>
        <Button onClick={handleConfirm} autoFocus>
          {trlb('commons_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
