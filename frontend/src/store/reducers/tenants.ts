import { AUTH_ACTION, TENANTS_ACTION } from 'store/actions'
import { ITenant } from '@smambu/lib.constants/src/types/tenants'
import { IUser } from '@smambu/lib.constants'

type TenantsState = {
  tenants: Record<string, ITenant>
  users: Record<string, IUser>
}

const getInitialState = (): TenantsState => ({
  tenants: {},
  users: {},
})

export default function reducer (state = getInitialState(), action: any): TenantsState {
  switch (action.type) {
    case TENANTS_ACTION.SET_DATA:
      return {
        ...state,
        ...action.data,
      }
    case TENANTS_ACTION.SET_TENANT:
      return {
        ...state,
        tenants: {
          ...state.tenants,
          [action.data._id]: action.data,
        },
      }
    case TENANTS_ACTION.SET_TENANT_PROPS:
      return {
        ...state,
        tenants: {
          ...state.tenants,
          [action.data.tenantId]: {
            ...state.tenants[action.data.tenantId],
            ...action.data,
          },
        },
      }
    case AUTH_ACTION.LOG_OUT:
      return getInitialState()
    default:
      return state
  }
}
