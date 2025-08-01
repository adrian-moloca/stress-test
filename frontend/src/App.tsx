import Toasts from 'components/Toasts'
import LoadingBar from 'components/LoadingBar'
import React, { useEffect } from 'react'
import ErrorBoundary from 'components/ErrorBoundary'
import { Box, useMediaQuery } from '@mui/material'
import AuthenticatedRoutes from 'AuthenticatedRoutes'
import UnAuthenticatedRoutes from 'UnAuthenticatedRoutes'
import { useOnLoading } from 'hooks'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import SmallScreen from 'pages/SmallScreen'
import { useAppSelector } from 'store'
import { getLocalStorageItem, setAppLanguage } from 'utilities'
import { PREFERRED_LOCALE, TranslatorLanguages, parseBrowserLanguage } from '@smambu/lib.constants'
import TenantsRoutes from 'TenantsRoutes'
import StandardDialog from 'components/StandardDialog'
import { Replay } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import { LANG_ACTION } from 'store/actions'
import { Helmet } from 'react-helmet-async'
import { useFullScreenListener } from 'hooks/uiHooks'
import { VERSION_CHECK_INTERVAL } from 'config/constant'
import { useGetURConfigsLastUpdate } from 'hooks/urHooks/configHooks'

const App: React.FC = () => {
  const {
    isAuthenticatedWithTenant,
    isAuthenticatedWithoutTenant
  } = useAppSelector(state => state.auth)
  const isSmallScreen = useMediaQuery((theme: any) => theme.breakpoints.down('md'))
  const { adapterLocale, localeText } = useAppSelector(state => state.language)
  const { shouldRedirect } = useOnLoading()
  const dispatch = useDispatch()
  useFullScreenListener()

  useEffect(() => {
    const availableLanguages = Object.keys(TranslatorLanguages) as string[]

    const preferredLanguage = getLocalStorageItem(PREFERRED_LOCALE)
    const browserLanguage = parseBrowserLanguage(navigator.language)

    let language: string = TranslatorLanguages.en
    if (availableLanguages.includes(preferredLanguage!)) language = preferredLanguage!
    else if (availableLanguages.includes(browserLanguage!)) language = browserLanguage

    setAppLanguage(language)

    dispatch({ type: LANG_ACTION.SET_LANG, payload: language })
  }, [dispatch])

  const [needReloadDueToVersion, doReload] = useVersionCheck()

  if (isSmallScreen) return <SmallScreen />

  const getRoutes = () => {
    if (isAuthenticatedWithTenant && shouldRedirect) return <AuthenticatedRoutes />
    if (isAuthenticatedWithoutTenant && shouldRedirect) return <TenantsRoutes />
    return <UnAuthenticatedRoutes />
  }

  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDateFns}
        adapterLocale={adapterLocale}
        localeText={localeText}>
        <Helmet>
          <html lang={adapterLocale.code} />
        </Helmet>
        <Box
          sx={{
            display: 'flex',
            minHeight: '100vh',
            width: '100%',
            backgroundColor: theme => theme.palette.background.paper,
          }}
        >
          {getRoutes()}
        </Box>
        <LoadingBar />
        <Toasts />
        <StandardDialog
          open={needReloadDueToVersion}
          titleKey={'new_version_title'}
          textKey={'new_version_available'}
          onClose={doReload}
          closeIcon={<Replay />}
        />
      </LocalizationProvider>
    </ErrorBoundary>
  )
}

const useVersionCheck = () => {
  const appVersionFile = 'version.json'
  const [needReload, setNeedReload] = React.useState(false)
  const currentVersion = React.useMemo(() => import.meta.env.APP_VERSION, [])
  const isAuthenticatedWithTenant = useAppSelector(state => state.auth.isAuthenticatedWithTenant)
  const { checkURConfigsUpdated } = useGetURConfigsLastUpdate()
  const intervalRef = React.useRef<any>()

  React.useEffect(() => {
    checkURConfigsUpdated()

    const checkVersion = async () => {
      try {
        if (isAuthenticatedWithTenant) {
          const urConfigsUpdated = await checkURConfigsUpdated()
          if (urConfigsUpdated) {
            setNeedReload(true)

            return
          }
        }

        // we decided not to use `useCall` and don't show a toast since this is a background operation that the user is usually unaware of
        const versionResponse = await fetch(`/${appVersionFile}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const versionData = await versionResponse.json()

        if (versionData.version !== currentVersion && currentVersion)
          setNeedReload(true)
      } catch (error) {
        console.error('Error checking version:', error)
      }
    }

    if (intervalRef.current != null)
      clearInterval(intervalRef.current)
    intervalRef.current = setInterval(checkVersion, VERSION_CHECK_INTERVAL)

    return () => clearInterval(intervalRef.current)
  }, [isAuthenticatedWithTenant, currentVersion, checkURConfigsUpdated])

  return [needReload, () => {
    location.reload()
  }] as const
}

export default App
