import { trlb } from 'utilities'
import { Box, Button, Typography } from '@mui/material'
import React from 'react'
import { useNavigate } from 'react-router'

const styles = {
  container: {
    width: '100vw',
    zIndex: 10000,
    backgroundColor: 'white',
    color: 'black',
    padding: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '100vh',
  },
  spacing: {
    height: 10,
    width: '100%',
  },
}

const ComponentPassedDownError = ({ error: { message } }: { error: Error }) => {
  const navigate = useNavigate()

  return (
    <Box sx={styles.container}>
      <Typography variant='h3'>{trlb('error_passedDownError_title')}</Typography>
      <Box sx={styles.spacing} />
      <Typography variant='h4'>{trlb('error_passedDownError_text')}</Typography>
      <Box sx={styles.spacing} />
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          width: '50%',
        }}
      >
        <Button variant='contained' onClick={() => location.reload()} sx={{ mr: 2 }}>
          {trlb('error_reload_button')}
        </Button>
        <Button
          variant='contained'
          onClick={() => {
            navigate('/')
            location.reload()
          }}
        >
          {trlb('error_goHome_button')}
        </Button>
      </Box>
      <Box sx={styles.spacing} />
      <Typography variant='h6'>{message}</Typography>
    </Box>
  )
}

export default ComponentPassedDownError
