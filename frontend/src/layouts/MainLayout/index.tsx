import React from 'react'
import Header from './components/Header'
import MenuDrawer, { DrawerHeader } from 'components/MenuDrawer'
import { Box } from '@mui/material'
import { useAppSelector } from 'store'

interface MainLayoutProps {
  children: any
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const global = useAppSelector(state => state.global)

  if (global.fullScreen) return <>{children}</>

  return (
    <>
      <Header />
      <MenuDrawer />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            flex: 1,
          }}
        >
          <DrawerHeader />
          {children}
        </Box>
      </Box>
    </>
  )
}

export default MainLayout
