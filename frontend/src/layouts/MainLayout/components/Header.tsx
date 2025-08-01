import React from 'react'
import { Toolbar, Typography, IconButton, Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { LogoutOutlined } from '@mui/icons-material'
import { useLogout } from 'hooks'
import Notifications from './Notifications'
import { getFullName } from '@smambu/lib.constants'
import { useAppSelector } from 'store'
import EnvBadge from './EnvBadge'
import LanguageSelector from './LanguageSelector'
import TenantBadge from './TenantBadge'
import UserManual from './UserManual'

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: prop => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}))

const Header = () => {
  const logout = useLogout()
  const user = useAppSelector(state => state.auth.user)

  return (
    <AppBar position='fixed' sx={{ boxShadow: 'none', backdropFilter: 'blur(6px)', backgroundColor: 'transparent' }}>
      <Toolbar sx={{ gap: 1, justifyContent: 'space-between', bgcolor: 'background.paper', opacity: 0.7 }}>
        <Box sx={{ flexGrow: 1 }} />
        <UserManual />
        <EnvBadge />
        <Typography sx={{ color: 'black', mr: 2 }}>{getFullName(user, true)}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LanguageSelector />
          <Notifications />
          <TenantBadge />
          <IconButton aria-label='open drawer' onClick={logout as any} edge='start'>
            <LogoutOutlined />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
