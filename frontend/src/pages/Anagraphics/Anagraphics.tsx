import React from 'react'
import { AnagraphicsProvider } from './components/AnagraphicContext'
import MainContainer from './components/MainContainer'
import { Box, Typography } from '@mui/material'
import { trlb } from 'utilities'
import { useGetAnagraphicsSetups } from 'hooks'

const Anagraphics = ({ anagraphicType }: { anagraphicType: string | null }) => {
  const anagraphicsSetups = useGetAnagraphicsSetups()

  if (anagraphicType === null || anagraphicsSetups[anagraphicType] == null) return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant='h4'>{trlb('anagraphics_loadingDynamicsAnagraphics')}</Typography>
    </Box>
  )

  return (
    <AnagraphicsProvider anagraphicType={anagraphicType} anagraphicsSetups={anagraphicsSetups}>
      <MainContainer />
    </AnagraphicsProvider>
  )
}

export default Anagraphics
