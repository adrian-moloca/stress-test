import React from 'react'
import { Box, Button, Dialog, Typography } from '@mui/material'
import { trlb } from '../../../utilities/translator/translator'

interface ActivateModalProps {
  open: boolean
  onClose: () => void
}

const ActivateModal = ({ open, onClose }: ActivateModalProps) => {
  return (
    <Dialog onClose={onClose} open={open}>
      <Box sx={{ p: 3, width: 400 }}>
        <Typography align='center' variant='h6'>
          {trlb('user_not_active_msg')}
        </Typography>
        <Typography mb={3} align='center' variant='h6'>
          {trlb('send_request_for_mail_activation')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button color='primary' variant='contained' onClick={onClose}>
            {trlb('login_got_it')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default ActivateModal
