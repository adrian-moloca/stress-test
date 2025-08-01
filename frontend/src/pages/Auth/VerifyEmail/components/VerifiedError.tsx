import React from 'react'
import { Button, Typography, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { trlb } from 'utilities'
import { routes } from 'routes/routes'

const VerifiedError = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ gap: 2 }}>
      <Typography align='center' variant='h4'>
        {trlb('login_emailVerificationProblem')}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button color='primary' variant='contained' sx={{ marginTop: '5%' }} onClick={() => navigate(routes.login)}>
          {trlb('login_goToLogin')}
        </Button>
      </Box>
    </Box>
  )
}

export default VerifiedError
