import React from 'react'
import { Box, Button, Dialog, Typography } from '@mui/material'
import { trlb } from '../../../utilities/translator/translator'
interface VerifyModalProps {
  open: boolean
  onClose: () => void
  onRetry: () => void
  submitForm: () => void
}

const VerifyModal = ({ open, onClose, onRetry, submitForm }: VerifyModalProps) => {
  return (
    <Dialog onClose={onClose} open={open}>
      <Box sx={{ p: 3, width: 400 }}>
        <Typography align='center' variant='h6'>
          {trlb('user_not_verified')}
        </Typography>
        <Typography mb={3} align='center' variant='h6'>
          {trlb('user_not_verified_subtitle')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            color='secondary'
            variant='contained'
            sx={{ mr: 2 }}
            onClick={() => {
              submitForm()
              onClose()
            }}
          >
            {trlb('login_iHaveVerified')}
          </Button>
          <Button color='primary' variant='contained' onClick={onRetry}>
            {trlb('login_sendVerificationAgain')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
export default VerifyModal
