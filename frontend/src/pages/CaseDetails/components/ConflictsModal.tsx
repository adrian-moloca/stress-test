import React from 'react'
import Modal from '@mui/material/Modal'
import { Box, Button, Typography } from '@mui/material'
import { trlb } from 'utilities'
import { CaseForm } from '@smambu/lib.constants'
import { WarningIcon } from 'components/Icons'

interface IConflictsModalProps {
  show: boolean
  caseObj: CaseForm | null
  editedFields: string[]
  conflictingFields: string[]
  acceptFun: (editedCase: CaseForm, acceptedConflicts: string[]) => void
  cancelFun: () => void
}

const ConflictsModal: React.FC<IConflictsModalProps> = ({
  show,
  caseObj,
  editedFields,
  conflictingFields,
  acceptFun,
  cancelFun,
}) => {
  const titleLabel = trlb('conflictsTitle')
  const subtitleLabel = trlb('conflictsSubTitle')
  const subtitle2Label = trlb('conflictsSubTitle2')
  const footerLabel = trlb('conflictsFooter')
  const saveLabel = trlb('saveUnconflicting')
  const cancelLabel = trlb('cancelSimultaneousOperation')

  const canSave = editedFields.length > conflictingFields.length

  const onClick = () => {
    // This is impossible but just to play it safe
    if (caseObj === null) throw new Error('Case obj missing')

    acceptFun(caseObj, conflictingFields)
  }

  const getEditedElement = (item: string) => {
    const isConflicting = conflictingFields.includes(item)
    const iconDisplay = isConflicting ? 'block' : 'none'

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant='body1' sx={{ fontWeight: '400' }}>
          {item}
        </Typography>
        <WarningIcon sx={{ display: iconDisplay, ml: 2 }} />
      </Box>
    )
  }

  return (
    <Modal open={show} aria-labelledby='modal-modal-title' aria-describedby='modal-modal-description'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: '#FFFFFF',
            width: '60vw',
            padding: 4,
            maxHeight: '80vh',
            borderRadius: theme => theme.constants.radius,
          }}
        >
          <Typography variant='h5'>{titleLabel}</Typography>
          <Typography variant='h6'>{subtitleLabel}</Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography variant='body1'>{subtitle2Label}</Typography>
            <WarningIcon sx={{ ml: 1 }} />
          </Box>
          <Box sx={{ marginY: 2, overflowY: 'auto' }}>
            <ul>
              {editedFields.map(current => (
                <li key={current}>{getEditedElement(current)}</li>
              ))}
            </ul>
          </Box>
          <Typography variant='h6'>{footerLabel}</Typography>
          <Box
            sx={{ marginTop: 2, display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}
          >
            <Button onClick={cancelFun}>{cancelLabel}</Button>
            <Button variant='contained' onClick={onClick} disabled={!canSave}>
              {saveLabel}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default ConflictsModal
