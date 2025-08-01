import React from 'react'
import { routes } from 'routes/routes'

import { useNavigate } from 'react-router-dom'
import { useAppSelector } from 'store'
import { Box, Typography } from '@mui/material'
import logo from '../assets/img/LogoSMAMBU.png'
import { trlb } from 'utilities'

const WelcomePage = ({ noRedirect }: { noRedirect?: boolean }) => {
  const navigate = useNavigate()
  const isLoading = useAppSelector(state => state.global.loading.length)
  React.useEffect(() => {
    if (!noRedirect && !isLoading) navigate(routes.dashboard)
  }, [navigate, isLoading, noRedirect])

  if (isLoading) return null
  return (
    <Box
      flexDirection={'column'}
      display={'flex'}
      justifyContent={'center'}
      alignItems={'center'}
      sx={{
        height: '100%',
        width: '100%',
      }}
    >
      <Box>
        <Typography variant={'h1'} color='primary'>
          {trlb('welcomeTo')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <img src={logo} width={500} />
      </Box>
    </Box>
  )
}
export default WelcomePage
