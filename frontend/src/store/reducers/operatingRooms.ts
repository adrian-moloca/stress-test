import { Identifier, OperatingRoom } from '@smambu/lib.constants'
import { OPERATING_ROOMS_ACTION } from 'store/actions'
interface IOperatingRoomsState {
  [operatingRoomId: Identifier]: OperatingRoom
}

const initialState: IOperatingRoomsState = {}

export default function reducer (state = initialState, action: any): IOperatingRoomsState {
  switch (action.type) {
    case OPERATING_ROOMS_ACTION.SET_OPERATING_ROOMS:
      return {
        ...action.data,
      }
    case OPERATING_ROOMS_ACTION.SET_OPERATING_ROOM:
      return {
        ...state,
        [action.data.operatingRoomId]: action.data,
      }
    default:
      return state
  }
}
