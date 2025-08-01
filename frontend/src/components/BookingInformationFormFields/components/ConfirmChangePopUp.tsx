import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'
import { trlb } from 'utilities'
import { NewContractMatchOpStandard } from '@smambu/lib.constants'

const ConfirmChangePopUp = ({
  changeContractDate,
  handleDeclineChangeContract,
  handleChangeContract,
  newContractMatch,
  caseNumber,
}: {
  changeContractDate: Date | null
  handleDeclineChangeContract: () => void
  handleChangeContract: () => void
  newContractMatch: NewContractMatchOpStandard
  caseNumber: string
}) => {
  const dialogContent = React.useMemo(() => {
    if (caseNumber === '') return trlb('new_booking_confirm_change_contract')

    switch (newContractMatch) {
      case NewContractMatchOpStandard.noMatch:
        return trlb('booking_confirm_change_contract_no_match_text')
      case NewContractMatchOpStandard.matchWithConflict:
        return trlb('booking_confirm_change_contract_match_conflit_text')
      default:
        return trlb('booking_confirm_change_contract_text')
    }
  }, [newContractMatch, caseNumber])

  return (
    <Dialog
      open={Boolean(changeContractDate)}
      onClose={handleDeclineChangeContract}
      aria-labelledby='responsive-dialog-title'
    >
      <DialogTitle id='responsive-dialog-title'>{trlb('booking_confirm_change_contract_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{dialogContent}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleDeclineChangeContract}>
          {trlb('commons_cancel')}
        </Button>
        <Button onClick={handleChangeContract} autoFocus>
          {trlb('commons_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmChangePopUp
