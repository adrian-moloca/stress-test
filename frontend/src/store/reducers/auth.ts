import { ICredential, UserPermissions } from '@smambu/lib.constants'
import { AUTH_ACTION } from 'store/actions'

export interface AuthState {
  isAuthenticatedWithoutTenant: boolean
  isAuthenticatedWithTenant: boolean
  user: any
  credential: Partial<ICredential> | null
  permissions: UserPermissions
}

const initialState: AuthState = {
  isAuthenticatedWithoutTenant: false,
  isAuthenticatedWithTenant: false,
  user: undefined,
  credential: null,
  permissions: {} as UserPermissions,
}

export default function reducer (state = initialState, action: any) {
  switch (action.type) {
    case AUTH_ACTION.LOGIN_WITHOUT_TENANT_SUCCESS:
      return {
        ...state,
        isAuthenticatedWithoutTenant: true,
        credential: action.data.credential,
      }
    case AUTH_ACTION.LOGIN_WITH_TENANT_SUCCESS:
      return {
        ...state,
        user: action.data.user,
        isAuthenticatedWithTenant: true,
        isAuthenticatedWithoutTenant: false,
      }
    case AUTH_ACTION.GET_CURRENT_USER_SUCCESS:
      return {
        ...state,
        isAuthenticatedWithTenant: true,
        isAuthenticatedWithoutTenant: false,
        user: action.data,
      }
    case AUTH_ACTION.GET_CURRENT_USER_ERROR:
      return {
        ...state,
        error: action.error,
      }
    case AUTH_ACTION.LOG_OUT:
      return {
        ...state,
        isAuthenticatedWithTenant: false,
        isAuthenticatedWithoutTenant: false,
      }
    case AUTH_ACTION.GET_PERMISSIONS_SUCCESS:
      return {
        ...state,
        permissions: action.data,
      }
    default:
      return state
  }
}
