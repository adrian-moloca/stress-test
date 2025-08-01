import { trlb } from 'utilities'
import { Alert, AlertTitle, Box, CircularProgress } from '@mui/material'
import React from 'react'
import { useAppSelector } from 'store'

const LoadingBar = () => {
  const isLoading = useAppSelector(state => state.global.loading.length)

  if (isLoading <= 0) return null
  else
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'flex-end',
          gap: 2,
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 3000,
        }}
      >
        <Alert
          sx={{
            position: 'relative',
            borderRadius: 'sm',
            boxShadow: theme => theme.constants.boxShadow,
          }}
          severity='info'
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: -1,
              width: 104,
            }}
          >
            <AlertTitle>{trlb('commons_loading')}</AlertTitle>
            <CircularProgress size={20} sx={{ mb: 1 }} />
          </Box>
        </Alert>
      </Box>
    )
}

export default LoadingBar
