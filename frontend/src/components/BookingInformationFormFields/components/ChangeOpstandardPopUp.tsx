import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'
import { trlb } from 'utilities'

const ChangeOpstandardPopUp = ({
  open,
  confirmWithOverWrite,
  confirmWithOutOverWrite,
  onClose,
}: {
  open: boolean
  confirmWithOverWrite: () => void
  confirmWithOutOverWrite: () => void
  onClose: () => void
}) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby='responsive-dialog-title'>
      <DialogTitle id='responsive-dialog-title'>{trlb('booking_confirm_change_contract_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{trlb('booking_confirm_change_opstandard_title')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          {trlb('commons_cancel')}
        </Button>
        <Button onClick={confirmWithOutOverWrite} autoFocus>
          {'mantain'}
        </Button>
        <Button onClick={confirmWithOverWrite} autoFocus>
          {'overwrite'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ChangeOpstandardPopUp
