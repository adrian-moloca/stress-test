import React, { CSSProperties, MouseEvent } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useTheme } from '@mui/material'
import { trlb } from 'utilities'
import { Check, Clear } from '@mui/icons-material'

type Props = {
  open: boolean
  titleKey?: string
  textKey?: string
  textVars?: Record<string, any>
  onClose: (e?: MouseEvent<HTMLButtonElement>) => void
  onConfirm?: (e?: MouseEvent<HTMLButtonElement>) => void
  closeKey?: string
  closeIcon?: React.ReactNode
  confirmKey?: string
  confirmDisabled?: boolean
  children?: React.ReactNode
  dialogStyle?: CSSProperties
  onClick?: React.MouseEventHandler<HTMLDivElement> | undefined
}

const StandardDialog = ({
  open,
  titleKey,
  textKey,
  textVars,
  onClose,
  onConfirm,
  closeKey,
  closeIcon,
  confirmKey,
  confirmDisabled,
  children,
  dialogStyle,
  onClick,
}: Props) => {
  const isLoading = false
  const theme = useTheme()
  const onCloseDialog = () => (!isLoading ? onClose!() : null)

  const oneButtonOnly = onConfirm === undefined

  const buttonsStyle = oneButtonOnly ? 'center' : 'space-between'

  const hasTitle = titleKey !== null && titleKey !== undefined
  const titleLabel = hasTitle ? trlb(titleKey!) : ''

  const hasText = textKey !== null && textKey !== undefined

  const getText = () => {
    if (!hasText) return ''
    const hasTextVars = textVars !== null && textVars !== undefined

    if (hasTextVars) return trlb(textKey, textVars)

    return trlb(textKey)
  }

  const getCloseButton = () => {
    if (onClose === null || onClose === undefined) return null

    if (closeKey !== null && closeKey !== undefined && closeKey !== '') {
      const closeLabel = trlb(closeKey)

      return (
        <Button variant='outlined' disabled={isLoading} data-cy='close' onClick={onClose}>
          <Typography>{closeLabel}</Typography>
        </Button>
      )
    }

    return (
      <Button variant='outlined' disabled={isLoading} data-cy='close' onClick={onClose}>
        {closeIcon || <Clear />}
      </Button>
    )
  }

  const getConfirmButton = () => {
    if (onConfirm === null || onConfirm === undefined) return null

    if (confirmKey !== null && confirmKey !== undefined && confirmKey !== '') {
      const confirmLabel = trlb(confirmKey)

      return (
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
          <Typography>{confirmLabel}</Typography>
        </Button>
      )
    }

    return (
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
  }

  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      style={{ zIndex: 2001, ...dialogStyle }}
      PaperProps={{ style: { padding: theme.spacing(4) } }}
      onClick={onClick}
    >
      {hasTitle && <DialogTitle sx={{ textAlign: 'center', padding: 0, fontSize: '2rem', wordBreak: 'break-all' }}>{titleLabel}</DialogTitle>}
      {hasText && (
        <DialogContent
          style={{
            textAlign: 'center',
            padding: '8px 0px',
            whiteSpace: 'break-spaces',
          }}
        >
          <Typography variant='h5'>{getText()}</Typography>
        </DialogContent>
      )}
      {children}
      <div style={{ height: theme.spacing(4) }} />
      <DialogActions style={{ padding: '8px 0px', justifyContent: buttonsStyle }}>
        {getCloseButton()}
        {getConfirmButton()}
      </DialogActions>
    </Dialog>
  )
}

export default StandardDialog
