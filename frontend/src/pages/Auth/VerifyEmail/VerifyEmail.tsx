import React, { useEffect } from 'react'
import AuthLayout from 'layouts/AuthLayout'
import { Typography, Box } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { trlb } from 'utilities'
import logo from '../../../assets/img/LogoSMAMBU.png'
import { routes } from 'routes/routes'
import { useVerifyEmail } from 'hooks'
import _ from 'lodash'
import VerifiedSuccess from './components/VerifiedSuccess'
import VerifiedError from './components/VerifiedError'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = location.search.slice(1).split('=')
  const token = params ? params[1] : ''
  const { isVerified } = useVerifyEmail(token)
  const goToResetPassword = () =>
    _.delay(() => {
      navigate(`${routes.resetPassword}?token=${token}`)
    }, 5000)

  useEffect(() => {
    if (isVerified === true) goToResetPassword()
  }, [isVerified])

  return (
    <AuthLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <img src={logo} width={160} />
      </Box>
      {isVerified === null
        ? (
          <Typography align='center' variant='h4'>
            {trlb('login_verifyingEmail')}
          </Typography>
        )
        : null}
      {isVerified === true ? <VerifiedSuccess token={token} /> : null}
      {isVerified === false ? <VerifiedError /> : null}
    </AuthLayout>
  )
}

export default VerifyEmail
