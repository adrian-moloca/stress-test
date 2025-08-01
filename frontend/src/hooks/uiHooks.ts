import React from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'store'
import { GLOBAL_ACTION } from 'store/actions'

export const useGetScreenSize = () => {
  const [width, setWidth] = React.useState(window.innerWidth)
  const [height, setHeight] = React.useState(window.innerHeight)

  const updateWidthAndHeight = () => {
    setWidth(window.innerWidth)
    setHeight(window.innerHeight)
  }

  React.useEffect(() => {
    window.addEventListener('resize', updateWidthAndHeight)
    return () => window.removeEventListener('resize', updateWidthAndHeight)
  }, [])

  return { width, height }
}

export default function useOnScreen () {
  const [isIntersecting, setIntersecting] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const observer = React.useMemo(() => new IntersectionObserver(
    ([entry]) => setIntersecting(entry.isIntersecting)
  ),
  [])

  React.useEffect(() => {
    if (!ref.current) return
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { isIntersecting, ref }
}

export const useFullScreenListener = () => {
  const dispatch = useDispatch()

  React.useEffect(() => {
    const changeFullScreen = () => {
      dispatch({ type: GLOBAL_ACTION.TOGGLE_FULL_SCREEN })
    }

    document.addEventListener('fullscreenchange', changeFullScreen)
    document.addEventListener('webkitfullscreenchange', changeFullScreen)
    document.addEventListener('mozfullscreenchange', changeFullScreen)
    document.addEventListener('MSFullscreenChange', changeFullScreen)

    return () => {
      document.removeEventListener('fullscreenchange', changeFullScreen)
      document.removeEventListener('webkitfullscreenchange', changeFullScreen)
      document.removeEventListener('mozfullscreenchange', changeFullScreen)
      document.removeEventListener('MSFullscreenChange', changeFullScreen)
    }
  }, [dispatch])
}

export const useFullScreen = () => {
  const { fullScreen, fullScreenEnabled } = useAppSelector(state => state.global)
  const dispatch = useDispatch()

  const toggleFullScreen = () => {
    const elem = document.documentElement as HTMLElement & {
      mozRequestFullScreen(): Promise<void>
      webkitRequestFullscreen(): Promise<void>
      msRequestFullscreen(): Promise<void>
      mozCancelFullScreen(): Promise<void>
    }

    const exitDoc = document as Document & {
      mozCancelFullScreen(): Promise<void>
      webkitExitFullscreen(): Promise<void>
      msExitFullscreen(): Promise<void>
    }

    /* View in fullscreen */
    function openFullscreen () {
      elem.requestFullscreen?.()
      elem.mozRequestFullScreen?.() // Firefox
      elem.webkitRequestFullscreen?.() // Safari
      elem.msRequestFullscreen?.() // IE11
    }

    /* Close fullscreen */
    function closeFullscreen () {
      exitDoc.exitFullscreen?.()
      exitDoc.mozCancelFullScreen?.() // Firefox
      exitDoc.webkitExitFullscreen?.() // Safari
      exitDoc.msExitFullscreen?.() // IE11
    }

    if (fullScreen) closeFullscreen()
    else openFullscreen()
  }

  const toggleEnabledFullScreen = () => {
    dispatch({ type: GLOBAL_ACTION.TOGGLE_ENABLED_FULL_SCREEN })
    toggleFullScreen()
  }

  return { fullScreen, toggleFullScreen, toggleEnabledFullScreen, fullScreenEnabled }
}
