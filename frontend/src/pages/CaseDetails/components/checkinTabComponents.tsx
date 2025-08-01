import { CaseStatus } from '@smambu/lib.constants'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { trlb } from 'utilities'
import React from 'react'

export const ChangeStatusAlert = ({
  open,
  onClose,
  onConfirm,
  currentStatus,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  currentStatus: CaseStatus
}) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby='responsive-dialog-title'>
      <DialogTitle id='responsive-dialog-title'>{trlb('case_tab_checkin_changeStatusAlert_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {trlb('case_tab_checkin_changeStatusAlert_text', {
            currentStatus: trlb(currentStatus),
          })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          {trlb('commons_cancel')}
        </Button>
        <Button onClick={onConfirm} autoFocus>
          {trlb('commons_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
