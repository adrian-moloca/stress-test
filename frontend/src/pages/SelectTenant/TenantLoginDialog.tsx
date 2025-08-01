import React, { CSSProperties } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useTheme } from '@mui/material'
import { trlb } from 'utilities'
import { Check, Clear } from '@mui/icons-material'

const TenantLoginDialog = ({
  open = false,
  title = 'generic_dialogTitle',
  text = '',
  onClose = () => {},
  onConfirm = () => {},
  confirmDisabled = false,
  children = null,
  dialogStyle = {},
  isLoading = false,
}: {
  open?: boolean
  title?: string
  text?: string
  onClose?: () => void | null
  onConfirm?: any
  confirmDisabled?: boolean
  children?: React.ReactNode
  dialogStyle?: CSSProperties
  isLoading?: boolean
}) => {
  const theme = useTheme()
  const onCloseDialog = () => (!isLoading ? onClose() : null)
  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      style={{ zIndex: 2001, ...dialogStyle }}
      PaperProps={{ style: { padding: theme.spacing(4) } }}
    >
      <DialogTitle sx={{ textAlign: 'center', padding: 0, fontSize: '2rem' }}>{trlb(title)}</DialogTitle>
      {text
        ? (
          <DialogContent
            style={{
              textAlign: 'center',
              padding: '8px 0px',
              whiteSpace: 'break-spaces',
            }}
          >
            <Typography variant='subtitle1'>{trlb(text)}</Typography>
          </DialogContent>
        )
        : null}
      {children}
      <div style={{ height: theme.spacing(4) }} />
      <DialogActions style={{ padding: '8px 0px', justifyContent: 'space-between' }}>
        {onClose
          ? (
            <Button variant='outlined' disabled={isLoading} data-cy='close' onClick={onClose}>
              <Clear />
            </Button>
          )
          : (
            <div />
          )}
        {onConfirm
          ? (
            <Button
              data-cy='confirm'
              variant='contained'
              color='primary'
              disabled={isLoading || confirmDisabled}
              onClick={onConfirm}
              style={
                {
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                  },
                } as CSSProperties
              }
            >
              <Check style={{ fill: 'white' }} />
            </Button>
          )
          : (
            <div />
          )}
      </DialogActions>
    </Dialog>
  )
}

export default TenantLoginDialog
