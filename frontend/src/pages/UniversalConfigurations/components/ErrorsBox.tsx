import { Box, Button, Typography } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'
import { tJsonError } from '../UniversalConfigurations'

const ErrorsBox = ({
  newData,
  error,
  onReset,
}: {
  newData: string,
  error: tJsonError,
  onReset: () => void
}) => {
  // if there is the error.errorString in the newData, it will be highlighted
  const getErrorString = () => {
    let index = error.errorIndex ?? -1

    if (error.errorString) {
      const errorString = error.errorString.trim()
      index = newData.indexOf(errorString)
    }

    if (index === -1) return newData

    return (
      <>
        {newData.slice(0, index)}
        <span style={{ backgroundColor: '#ff0000' }}>{newData.slice(index, index + 1)}</span>
        {newData.slice(index + 1)}
      </>
    )
  }

  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}
    >
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }} >
        <Typography variant='h5' color='error'>{trlb('ur_configs_error')}</Typography>
      </Box>
      <Box
        sx={{
          height: '50vh',
          width: '100%',
          border: theme => `1px solid ${theme.palette.grey[400]}`,
          overflow: 'auto',
          textAlign: 'left',
          p: 1,
        }} >
        <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }} >
          {getErrorString()}
        </Typography>
      </Box>
      <Typography variant='body1' color='error'>
        {error.message}
      </Typography>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
        <Button variant='outlined' color='primary' onClick={onReset}>
          {trlb('commons_cancel')}
        </Button>
      </Box>
    </Box>
  )
}

export default ErrorsBox
