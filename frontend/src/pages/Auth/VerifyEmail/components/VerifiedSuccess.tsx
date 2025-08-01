import React from 'react'
import { Button, Typography, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { trlb } from 'utilities'
import { routes } from 'routes/routes'

const VerifiedSuccess = ({ token }: { token: string }) => {
  const navigate = useNavigate()

  return (
    <Box sx={{ gap: 2 }}>
      <Typography align='center' variant='h4'>
        {trlb('login_emailVerified_success')}
      </Typography>
      <Typography align='center' variant='body1'>
        {trlb('login_reset_password_redirect')}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          color='primary'
          variant='contained'
          sx={{ marginTop: '5%' }}
          onClick={() => navigate(`${routes.resetPassword}?token=${token}`)}
        >
          {trlb('login_reset_password_now')}
        </Button>
      </Box>
    </Box>
  )
}

export default VerifiedSuccess
