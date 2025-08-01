import { IUser } from '@smambu/lib.constants'
import { USER_ACTION } from 'store/actions'

export default function reducer (state = {}, action: any): Record<IUser['id'], IUser> {
  switch (action.type) {
    case USER_ACTION.GET_USERS_SUCCESS:
      return {
        ...state,
        ...action.data,
      }
    default:
      return state
  }
}
