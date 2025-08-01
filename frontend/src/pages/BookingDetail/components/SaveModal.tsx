import React from 'react'
import { Modal, Paper, Typography, Button, Toolbar, Box } from '@mui/material'
import { PageHeader, Space10, Space40 } from 'components/Commons'
import { CloseButton, SaveButton } from 'components/Buttons'
import { trlb } from 'utilities/translator/translator'
import { CaseForm, IUser, formatCaseForm, getFullName } from '@smambu/lib.constants'
import { FormikProps } from 'formik'
import { format, isValid } from 'date-fns'

export const bookingInitialValues = formatCaseForm({})

const SaveModal = ({
  open,
  onCancel,
  onConfirm,
  onConfirmAndGoToDetails,
  form,
  doctor,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  onConfirmAndGoToDetails?: () => void
  form: FormikProps<CaseForm>
  doctor?: Partial<IUser>
}) => {
  const date = form.values.bookingSection.date
  return (
    <Modal
      open={open}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper sx={{ width: '50%', p: 4 }}>
        <PageHeader button={<CloseButton onClick={onCancel} />} pageTitle={trlb('bookingRequest_saveModal_title')} />
        <Space40 />
        {doctor
          ? (
            <Typography variant='body1' sx={{ width: '100%', textAlign: 'center', margin: '10px 0px' }}>
              {trlb('bookingRequest_saveModal_doctor', { doctorName: getFullName(doctor, true) })}
            </Typography>
          )
          : null}
        <Space10 />
        {isValid(date)
          ? (
            <Typography variant='body1' sx={{ width: '100%', textAlign: 'center', margin: '10px 0px' }}>
              {trlb('bookingRequest_saveModal_date', {
                date: format(form.values.bookingSection.date, trlb('dateTime_date_time_string')),
              })}
            </Typography>
          )
          : null}
        <Space40 />
        <Typography
          variant='body1'
          sx={{
            width: '100%',
            textAlign: 'center',
            margin: '10px 0px',
            fontWeight: '600',
          }}
        >
          {trlb('bookingRequest_saveModal_text')}
        </Typography>
        <Space40 />
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Button onClick={onCancel}>{trlb('commons_cancel')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          {!form.values.caseNumber && (
            <SaveButton
              {...{
                onClick: onConfirmAndGoToDetails,
                label: trlb('bookingRequest_save_and_go_to_details'),
              }}
            />
          )}
          <SaveButton
            {...{
              onClick: onConfirm,
            }}
          />
        </Toolbar>
      </Paper>
    </Modal>
  )
}

export default SaveModal
