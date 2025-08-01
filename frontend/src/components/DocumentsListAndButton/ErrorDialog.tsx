import { DialogContent, DialogTitle, Dialog, DialogContentText, DialogActions, Button } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'

const ErrorDialog = ({
  alertMessage, setAlertMessage
}: {
  alertMessage: string | null
  setAlertMessage: (message: string | null) => void
}) => {
  if (alertMessage == null) return null

  return (
    <Dialog
      open={Boolean(alertMessage)}
      onClose={_ => setAlertMessage(null)}
      aria-labelledby='responsive-dialog-title'
      sx={{
        '& .MuiDialog-paper': {
          padding: '20px',
        },
      }}
    >
      <DialogTitle id='responsive-dialog-title'>{trlb('bucket_error_popup_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{alertMessage || ''}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAlertMessage(null)} autoFocus color='primary'>
          {trlb('commons_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ErrorDialog
