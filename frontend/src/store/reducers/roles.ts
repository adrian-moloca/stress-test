import { IRoles } from '@smambu/lib.constants'
import { ROLES_ACTION } from 'store/actions'

const initialState: IRoles = {} as IRoles

export default function reducer (state = initialState, action: any): IRoles {
  switch (action.type) {
    case ROLES_ACTION.GET_ROLES_SUCCESS:
      return {
        ...action.data,
      }
    default:
      return state
  }
}
