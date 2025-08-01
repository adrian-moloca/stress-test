import { CheckCircle, ChevronLeft, ChevronRight } from '@mui/icons-material'
import { Box, IconButton, Tab, Tabs } from '@mui/material'
import { defaultStyles } from 'ThemeProvider'
import { WarningIcon } from 'components/Icons'
import NotesIcon from '@mui/icons-material/Notes'
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff'
import React, { useState } from 'react'
import { trlb } from 'utilities'

const HIDE_SIDEBAR_RESOLUTION = import.meta.env.VITE_HIDE_SIDEBAR_RESOLUTION
const hideResolution = HIDE_SIDEBAR_RESOLUTION ? Number(HIDE_SIDEBAR_RESOLUTION) : null

interface ICaseDetailSideMenuProps {
  tab: string
  tabs: { [key: string]: any }
  setTab: (selected: string) => void
  showDocumentationWarnings: boolean
}

const CaseDetailSideMenu: React.FC<ICaseDetailSideMenuProps> = ({
  tab,
  tabs,
  setTab,
  showDocumentationWarnings
}) => {
  const [compact, setCompact] = useState(false)

  const handleResize = () => {
    const width = window.innerWidth

    if (hideResolution != null) {
      if (width < hideResolution) {
        setCompact(true)
        return
      }

      setCompact(false)
    }
  }

  React.useEffect(() => {
    window.addEventListener('resize', handleResize, false)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleMenu = () => setCompact(!compact)

  const minWidth = compact ? 0 : '185px'

  return (
    <Box
      sx={{
        minWidth,
        position: 'relative',
      }}
    >
      <IconButton
        aria-label='case detail side menu'
        onClick={toggleMenu}
        edge='start'
        size='small'
        sx={{
          position: 'absolute',
          left: compact ? 42 : 6,
          transform: compact ? 'translateX(0)' : 'translateX(170px)',
          top: 50,
          zIndex: 1300,
          borderRadius: '50%',
          border: theme => '1px solid' + theme.palette.primary.main,
          backgroundColor: 'white',
          '&:hover': {
            bgcolor: 'primary.light',
            opacity: 1,
          },
          height: 24,
          width: 24,
          opacity: 0.8,
        }}
      >
        {compact ? <ChevronLeft /> : <ChevronRight />}
      </IconButton>
      <Tabs
        value={tab}
        onChange={(_e, newValue) => setTab(newValue)}
        textColor='primary'
        indicatorColor='primary'
        orientation='vertical'
        sx={defaultStyles.VerticalTabsSx}
      >
        {Object.values(tabs).map(currentTab => (
          <Tab
            value={currentTab.key}
            key={currentTab.key}
            label={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: compact ? 'flex-end' : 'space-between',
                  gap: 1,
                  width: '100%',
                }}
              >
                {!compact && <Box>{trlb('case_tab_' + currentTab.key)}</Box>}
                <Box sx={{ display: 'flex' }}>
                  {currentTab?.showWarning && <WarningIcon variant='warning' />}
                  {currentTab.showTimestampsWarning && (
                    <HistoryToggleOffIcon sx={{ fill: theme => theme.palette.warning.main }} />
                  )}
                  {currentTab.isValid &&
                    <CheckCircle sx={{ fill: theme => theme.palette.primary.main }} />}
                  {!currentTab.isValid && showDocumentationWarnings && <WarningIcon />}
                  {currentTab.notes && <NotesIcon />}
                </Box>
              </Box>
            }
            sx={{ fontWeight: '600', alignItems: 'flex-start', minWidth: 0 }}
          />
        ))}
      </Tabs>
    </Box>
  )
}

export default CaseDetailSideMenu
