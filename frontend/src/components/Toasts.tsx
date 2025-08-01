import React from 'react'
import { useAppSelector } from 'store'
import { Alert, AlertTitle, IconButton, useTheme } from '@mui/material'
import { CancelOutlined } from '@mui/icons-material'
import { trlb } from 'utilities'
import { GLOBAL_ACTION } from 'store/actions'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

const Toasts = () => {
  const { toasts } = useAppSelector(state => state.global)
  const toast = toasts[0]
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const theme = useTheme()

  const removeToast = () =>
    dispatch({
      type: GLOBAL_ACTION.REMOVE_TOAST,
      data: toast,
    })

  React.useEffect(() => {
    if (toast?.type === 'success')
      setTimeout(() => {
        removeToast()
      }, 5000)
  }, [toast])

  if (!toast) return null

  let backgroundColor
  switch (toast.type) {
    case 'success':
      backgroundColor = theme.palette.success.main
      break

    case 'warning':
      backgroundColor = theme.palette.warning.main
      break

    case 'error':
      backgroundColor = theme.palette.error.main
      break

    default:
      backgroundColor = theme.palette.info.main
  }

  let color
  switch (toast.type) {
    case 'success':
      color = theme.palette.success.contrastText
      break

    case 'warning':
      color = theme.palette.warning.contrastText
      break

    case 'error':
      color = theme.palette.error.contrastText
      break

    default:
      color = theme.palette.info.contrastText
      break
  }

  let text = `commons_${toast.type}_toast`

  if (toast.text != null && toast.text !== '') {
    const textIsString = typeof toast.text === 'string'

    text = textIsString ? toast.text : JSON.stringify(toast.text)
  }

  const handleClickToast = () => {
    removeToast()
    if (toast.targetPath) navigate(toast.targetPath)
  }

  return (
    <Alert
      sx={{
        position: 'fixed',
        bottom: 15,
        left: 15,
        borderRadius: theme => theme.constants.radius,
        width: 'fit-content',
        maxWidth: 'calc(100% - 30px)',
        display: 'flex',
        zIndex: 1000000,
        cursor: 'pointer',
      }}
      severity={toast.type}
      icon={false}
      onClick={handleClickToast}
      onClose={() => removeToast()}
      style={{ backgroundColor, color }}
      action={
        <IconButton onClick={() => removeToast()} size='small' aria-label='close'>
          <CancelOutlined style={{ fill: color }} />
        </IconButton>
      }
    >
      <AlertTitle sx={{ mb: 0, mt: 0.1 }}>{trlb(text)}</AlertTitle>
    </Alert>
  )
}

export default Toasts
