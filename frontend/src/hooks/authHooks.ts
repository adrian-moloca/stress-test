import { AuthApi, UsersApi } from 'api'
import { PermissionsApi } from 'api/permissions.api'
import { ACCESS_TOKEN, ACCESS_TOKEN_WITHOUT_TENANT } from 'config/constant'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { routes } from 'routes/routes'
import { AUTH_ACTION, GLOBAL_ACTION, TENANTS_ACTION } from 'store/actions'
import { useGetSystemConfiguration, useSetAppCurrencySymbol } from './systemConfigurationHooks'
import useCall from './useCall'
import { useGetOperatingRooms } from './roomsHooks'
import { LoginResponseDto, LoginToTenantResponseDto, ToastType, TranslatorLanguages, parseUser } from '@smambu/lib.constants'
import { useAppSelector } from 'store'
import { getLocalStorageItem, setLocalStorageItem } from 'utilities'
import { useGetDynamicData } from './urHooks/configHooks'

export const useGetPermissions = () => {
  const dispatch = useDispatch()
  const call = useCall()

  return () =>
    call(async function getPermissions () {
      const permissions = await PermissionsApi.getPermissions()
      dispatch({
        type: AUTH_ACTION.GET_PERMISSIONS_SUCCESS,
        data: permissions,
      })
    })
}

export const useGetData = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const call = useCall()
  const getPermissions = useGetPermissions()
  const getOperatingRooms = useGetOperatingRooms()
  const getSystemConfiguration = useGetSystemConfiguration()
  const getDynamicData = useGetDynamicData()
  const setAppCurrencySymbol = useSetAppCurrencySymbol()

  return (res: LoginToTenantResponseDto) =>
    call(async function getData () {
      dispatch({
        type: AUTH_ACTION.LOGIN_WITH_TENANT_SUCCESS,
        data: {
          ...res,
          user: parseUser(res.user),
        },
      })
      dispatch({
        type: TENANTS_ACTION.SET_TENANT,
        data: res.tenant,
      })

      setLocalStorageItem(ACCESS_TOKEN, res.tokenWithTenant)
      await Promise.all([getOperatingRooms(),
        getPermissions(),
        getSystemConfiguration(),
        getDynamicData(),
        setAppCurrencySymbol()])

      navigate(routes.home)
      return true
    })
}

export const useLogin = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const call = useCall()
  const getData = useGetData()

  interface loginProps {
    email: string
    password: string
  }

  return (data: loginProps) =>
    call(async function login () {
      const res: LoginResponseDto | LoginToTenantResponseDto | Error = await AuthApi.login(data)

      if ('tokenWithoutTenant' in res) {
        setLocalStorageItem(ACCESS_TOKEN_WITHOUT_TENANT, res.tokenWithoutTenant)
        dispatch({
          type: TENANTS_ACTION.SET_DATA,
          data: {
            tenants: res.tenants.reduce((acc, tenant) => ({ ...acc, [tenant.tenantId]: tenant }),
              {}),
            users: res.users.reduce((acc, user) => ({ ...acc, [user._id]: parseUser(user) }), {}),
          },
        })
        dispatch({
          type: AUTH_ACTION.LOGIN_WITHOUT_TENANT_SUCCESS,
          data: {
            credential: { email: res.email, isSuperAdmin: res.isSuperAdmin },
          },
        })
        navigate(routes.home)
        return true
      } else if ('tokenWithTenant' in res) {
        return getData(res)
      } else {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: { text: res.message, type: 'error' },
        })
        return res
      }
    })
}

export const useSelectTenant = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const getData = useGetData()

  interface loginProps {
    email: string
    tenantId: string
  }

  return (data: loginProps) =>
    call(async function login () {
      const token = getLocalStorageItem(ACCESS_TOKEN_WITHOUT_TENANT)
      if (!token) return false

      const res: LoginToTenantResponseDto | Error = await AuthApi.loginToTenant(data, token)

      if ('tokenWithTenant' in res) {
        return getData(res)
      } else {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: { text: res.message, type: 'error' },
        })
        return res
      }
    })
}

export const useLogout = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const navigate = useNavigate()

  return (noRedirect?: boolean) =>
    call(async function logout () {
      await AuthApi.logout()
      dispatch({ type: AUTH_ACTION.LOG_OUT })
      localStorage.removeItem(ACCESS_TOKEN)
      localStorage.removeItem(ACCESS_TOKEN_WITHOUT_TENANT)
      window.location.reload()
      if (!noRedirect) navigate(routes.login)
    })
}

export const useGetCurrentUser = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const getPermissions = useGetPermissions()
  const getOperatingRooms = useGetOperatingRooms()
  const getSystemConfiguration = useGetSystemConfiguration()
  const getDynamicData = useGetDynamicData()
  const setAppCurrencySymbol = useSetAppCurrencySymbol()

  return () =>
    call(async function getCurrentUser () {
      const accessToken = getLocalStorageItem(ACCESS_TOKEN)

      if (!accessToken) return null

      const res = await UsersApi.getCurrentUser()

      dispatch({ type: AUTH_ACTION.GET_CURRENT_USER_SUCCESS, data: parseUser(res.user) })
      dispatch({ type: TENANTS_ACTION.SET_TENANT, data: res.tenant })

      await Promise.all([getOperatingRooms(),
        getPermissions(),
        getSystemConfiguration(),
        getDynamicData(),
        setAppCurrencySymbol()])

      return res
    })
}

export const useOnLoading = () => {
  const dispatch = useDispatch()
  const [shouldRedirect, setShouldRedirect] = React.useState<boolean>(true)
  const getCurrentUser = useGetCurrentUser()
  const logout = useLogout()

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (window.location.pathname.includes('reset-password')) {
        setShouldRedirect(false)
        if (user) logout(true)
      }

      dispatch({ type: GLOBAL_ACTION.STOP_LOADING, data: 'onStart' })
    })
  }, [])

  return { shouldRedirect }
}

export const useResetPassword = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const navigate = useNavigate()
  interface resetPasswordProps {
    password: string
    token: string
  }

  return (data: resetPasswordProps) =>
    call(async function resetPassword () {
      const res = await AuthApi.resetPassword(data)
      if (res === true) {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: { text: 'reset_password_success', type: 'success' },
        })
        navigate(routes.login)
        navigate(0)
      } else {
        throw new Error(res.message)
      }
    })
}

export const useForgotPassword = () => {
  const dispatch = useDispatch()
  const call = useCall()

  return (email: string, language: string) =>
    call(async function forgotPassword () {
      const body = { email, language }

      await AuthApi.forgotPassword(body)

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: { text: 'forgot_password_success', type: 'success' },
      })
    })
}

export const useResendVerificationEmail = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const { code } = useAppSelector(state => state.language)

  interface resendVerificationEmailProps {
    email: string
  }

  return (data: resendVerificationEmailProps) =>
    call(async function resendVerificationEmail () {
      await AuthApi.resendVerificationEmail(data, code || TranslatorLanguages.en)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: { text: 'login_resendVerificationEmail_success', type: 'success' },
      })
    })
}

export const useVerifyEmail = (token: string) => {
  const call = useCall()
  const [isVerified, setIsVerified] = React.useState<boolean | null>(null)
  const dispatch = useDispatch()

  React.useEffect(() => {
    call(async function verifyEmail () {
      if (token)
        AuthApi.verifyEmail(token)
          .then(() => {
            setIsVerified(true)
            dispatch({
              type: GLOBAL_ACTION.ADD_TOAST,
              data: { type: ToastType.success, text: 'login_emailVerified_success' },
            })
          })
          .catch(err => {
            console.error(err)
            setIsVerified(false)
            dispatch({
              type: GLOBAL_ACTION.ADD_TOAST,
              data: { type: ToastType.error, text: 'login_emailVerified_error' },
            })
          })
      else setIsVerified(null)
    })
  }, [token])

  return { isVerified }
}
