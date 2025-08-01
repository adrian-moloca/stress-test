import React from 'react'
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar'
import MuiAlert, { AlertProps, AlertColor } from '@mui/material/Alert'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert (
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

interface NotificationProps {
  open: boolean;
  origin?: SnackbarOrigin;
  message?: string;
  onClose: () => void;
  type?: AlertColor;
}

const Notification = ({ open, origin = { vertical: 'top', horizontal: 'right' }, message, onClose, type }: NotificationProps) => {
  return (
    <Snackbar
      anchorOrigin={origin}
      open={open}
      onClose={onClose}
    >
      <Alert severity={type} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default Notification
