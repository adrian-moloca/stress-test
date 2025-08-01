import React from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { trlb } from 'utilities'

const PendingBoxNotEmptyAlert = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby='responsive-dialog-title'>
      <DialogTitle id='responsive-dialog-title'>{trlb('pending_box_not_empty_alert_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{trlb('pending_box_not_empty_alert')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          {trlb('commons_cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PendingBoxNotEmptyAlert
