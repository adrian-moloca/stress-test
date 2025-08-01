import { Info } from '@mui/icons-material'
import { Box, Button, IconButton, Modal, Typography } from '@mui/material'
import React, { useState } from 'react'
import { trlb } from 'utilities'

interface ICaseEditedFieldsDialogProps {
  fieldsList: string[]
}

const CaseEditedFieldsDialog: React.FC<ICaseEditedFieldsDialogProps> = ({ fieldsList }) => {
  const [open, setOpen] = useState(false)

  const toggleDialog = () => setOpen(!open)

  const atLeastOneEdited = fieldsList.length > 0

  const titleKey = atLeastOneEdited ? 'caseEditedFields' : 'noFieldEdited'
  const titleLabel = trlb(titleKey)

  if (!atLeastOneEdited) return null

  return (
    <>
      <IconButton component='span' onClick={toggleDialog} size='small'>
        <Info />
      </IconButton>
      <Modal open={open} aria-labelledby='modal-modal-title' aria-describedby='modal-modal-description'>
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
              width: '40vw',
              padding: 4,
              maxHeight: '80vh',
              borderRadius: theme => theme.constants.radius,
            }}
          >
            <Typography variant='h5'>{titleLabel}</Typography>
            <Box sx={{ marginY: 2, overflowY: 'auto', display: atLeastOneEdited ? 'block' : 'none' }}>
              <ul>
                {fieldsList.map(current => (
                  <li key={current}>{current}</li>
                ))}
              </ul>
            </Box>
            <Box
              sx={{
                marginTop: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Button onClick={toggleDialog}>{trlb('caseEditedFieldsClose')}</Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  )
}

export default CaseEditedFieldsDialog
