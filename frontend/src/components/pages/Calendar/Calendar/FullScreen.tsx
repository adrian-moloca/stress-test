import { IconButton } from '@mui/material'
import { FullScreenEnterIcon, FullScreenExitIcon } from 'components/Icons'
import { useFullScreen } from 'hooks/uiHooks'
import React from 'react'

const FullScreen = () => {
  const {
    fullScreen,
    fullScreenEnabled,
    toggleFullScreen,
    toggleEnabledFullScreen
  } = useFullScreen()
  const fullScreenRef = React.useRef(fullScreen)

  React.useEffect(() => {
    if (fullScreenRef.current)
      return () => {
        toggleFullScreen()
      }
    else if (fullScreenEnabled)
      toggleFullScreen()
  }, [])

  return (
    <IconButton onClick={toggleEnabledFullScreen}>
      {fullScreen ? <FullScreenExitIcon /> : <FullScreenEnterIcon />}
    </IconButton>
  )
}

export default FullScreen
