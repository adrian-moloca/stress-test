export const ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN || 'ascos-token'
export const ACCESS_TOKEN_WITHOUT_TENANT = (import.meta.env.VITE_ACCESS_TOKEN || 'ascos-token') + '_without_tenant'

export const VERSION_CHECK_INTERVAL = import.meta.env.VITE_VERSION_CHECK_INTERVAL || 10000

export const ERRORS_FORCING_LOGOUT = [
  'error_userNotActive',
  'error_userEmailChanged',
  'error_invalidToken',
  'error_noAuthorizationHeader',
  'error_cannotVerifyToken'
]
