import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from 'pages/Auth/Login/Login'
import VerifyEmail from 'pages/Auth/VerifyEmail/VerifyEmail'
import ResetPassword from 'pages/Auth/ResetPassword/ResetPassword'
import { routes } from 'routes/routes'

const UnAuthenticatedRoutes = () => {
  return (
    <Routes>
      <Route path={routes.login} element={<Login />} />
      <Route path={routes.verifyEmail} element={<VerifyEmail />} />
      <Route path={routes.resetPassword} element={<ResetPassword />} />
      <Route path='*' element={<Login />} />
    </Routes>
  )
}

export default UnAuthenticatedRoutes
