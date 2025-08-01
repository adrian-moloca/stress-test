import { Typography } from '@mui/material'
import React from 'react'
import logo from '../assets/img/LogoSMAMBU.png'
import { trlb } from '../utilities/translator/translator'
import { styled, Theme } from '@mui/material/styles'

const Container = styled('div')(({ theme }: { theme: Theme }) => ({
  width: '100vw',
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  gap: 2,
  p: 4,
  backgroundColor: theme.palette.background.paper,
}))

const Image = styled('img')(() => ({
  width: '70%',
  maxWidth: 250,
}))

const Title = styled(Typography)(({ theme }: { theme: Theme }) => ({
  textAlign: 'center',
  color: theme.palette.primary.main,
}))

const SmallScreen = () => {
  return (
    <Container>
      <Image src={logo} />
      <Title variant='h4'>{trlb('deviceSmall_title')}</Title>
      <Typography variant='body1' align='center'>
        {trlb('deviceSmall_explanation')}
      </Typography>
    </Container>
  )
}

export default SmallScreen
