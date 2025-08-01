import { Box } from '@mui/material'
import React from 'react'

interface AuthLayoutProps {
  children: any
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
      }}
    >
      {children}
    </Box>
  )
}

export default AuthLayout
