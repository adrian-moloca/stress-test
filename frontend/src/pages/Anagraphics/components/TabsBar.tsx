import { anagraphicsTypes } from '@smambu/lib.constants'
import { Box, Tabs, Tab } from '@mui/material'
import React from 'react'
import { getLanguage } from 'utilities'
import { useAnagraphicsContext } from './AnagraphicContext'
import { defaultStyles } from 'ThemeProvider'
import { getSubTypeLabel } from './MainContainer'

const TabsBar = () => {
  const language = getLanguage()
  const { anagraphicSetup, selectedSubType, setSelectedSubType, edit } = useAnagraphicsContext()

  const handleChange = (_event: any, newValue: string) => {
    setSelectedSubType(newValue as anagraphicsTypes)
  }

  if (!selectedSubType || !anagraphicSetup.subTypes?.includes?.(selectedSubType)) return null
  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={selectedSubType}
        onChange={handleChange}
        textColor='primary'
        indicatorColor='primary'
        centered
        sx={defaultStyles.HorizontalTabsSx}
      >
        {anagraphicSetup.subTypes!.map(subType => {
          return (
            <Tab
              disabled={edit && subType !== selectedSubType}
              key={subType}
              value={subType}
              label={
                <span>
                  {getSubTypeLabel(anagraphicSetup, subType, language)}
                </span>
              }
              sx={{ fontWeight: '600' }}
            />
          )
        })}
      </Tabs>
    </Box>
  )
}

export default TabsBar
