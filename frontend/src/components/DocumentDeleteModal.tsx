import { NamedCaseFileToDelete } from '@smambu/lib.constants'
import { Box, Button, Modal, Typography } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'

interface IDocumentDeleteModalProps {
  fileToDelete: NamedCaseFileToDelete | null
  deleteFun: () => void
  closeFun: () => void
}
const DocumentDeleteModal: React.FC<IDocumentDeleteModalProps> = ({
  fileToDelete,
  deleteFun,
  closeFun
}) => {
  const open = fileToDelete !== null

  const documentName = fileToDelete?.displayName ?? ''

  const titleLabel = trlb('reallyDeleteDocument', { documentName })
  const subtitleLabel = trlb('deletionIsIrriversible')
  const cancelLabel = trlb('commons_cancel')
  const deleteLabel = trlb('deleteTargetDocument')

  return (
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
          <Typography variant='h5'>{subtitleLabel}</Typography>
          <Box
            sx={{
              marginTop: 2,
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Button onClick={closeFun}>{cancelLabel}</Button>
            <Button onClick={deleteFun} variant='contained'>
              {deleteLabel}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default DocumentDeleteModal
