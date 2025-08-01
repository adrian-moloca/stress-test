import React from 'react'
import { Modal, Paper, Typography, Button, Toolbar } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { PageHeader, Space40 } from 'components/Commons'
import { CloseButton, TextIconButton } from 'components/Buttons'
import { trlb } from 'utilities/translator/translator'
import { formatCaseForm } from '@smambu/lib.constants'

export const bookingInitialValues = formatCaseForm({})

const ConfirmSaveModal = ({
  confirmSave,
  onCancel,
  onConfirm,
}: {
  confirmSave: boolean
  setConfirmSave: (value: boolean) => void
  setOutsideDoctorSlots: (value: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}) => {
  return (
    <Modal
      open={confirmSave}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper sx={{ width: '40%', p: 4 }}>
        <PageHeader
          button={<CloseButton onClick={onCancel} />}
          pageTitle={trlb('bookingRequest_outOfSlotModalTitle')}
        />
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
          {trlb('bookingRequest_outOfSlotModalText')}
        </Typography>
        <Typography variant='body1' sx={{ width: '100%', textAlign: 'center', margin: '10px 0px' }}>
          {trlb('bookingRequest_outOfSlotModalText2')}
        </Typography>
        <Space40 />
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Button onClick={onCancel}>{trlb('commons_cancel')}</Button>
          <TextIconButton
            text={trlb('commons_confirm')}
            icon={<CheckIcon sx={{ marginRight: '10px' }} />}
            onClick={onConfirm}
          />
        </Toolbar>
      </Paper>
    </Modal>
  )
}

export default ConfirmSaveModal
