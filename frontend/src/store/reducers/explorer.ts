import { tExplorerState } from '@smambu/lib.constants'
import { subDays } from 'date-fns'
import { EXPLORER_ACTION } from 'store/actions'

const initialState: tExplorerState = {
  startDate: subDays(new Date(), 30).toISOString(),
  endDate: new Date().toISOString(),
}

export default function reducer (state = initialState, action: any): tExplorerState {
  switch (action.type) {
    case EXPLORER_ACTION.SET_EXPLORER_FILTERS:
      return action.data
    default:
      return state
  }
}
