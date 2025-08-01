import { ANESTHESIOLOGISTS_SCHEDULE_ACTION } from 'store/actions'

export interface AnesthesiologistsScheduleState {
  [key: string]: string[]
}

const initialState = {} as AnesthesiologistsScheduleState
export default function reducer (state = initialState, action: any) {
  switch (action.type) {
    case ANESTHESIOLOGISTS_SCHEDULE_ACTION.SET_ANESTHESIOLOGISTS_SCHEDULE:
      return Object.keys(action.payload).reduce((acc, curr) => {
        const payload = action.payload ?? {}

        acc[curr] = [...payload[curr]]

        return acc
      }, state)
    case ANESTHESIOLOGISTS_SCHEDULE_ACTION.CLEAR: {
      return {}
    }
    default:
      return state
  }
}
