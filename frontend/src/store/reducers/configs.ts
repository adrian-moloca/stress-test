import { CONFIG_ACTION } from 'store/actions'
import { ISystemConfiguration } from '@smambu/lib.constants'

const initialState: ISystemConfiguration = {} as ISystemConfiguration

export default function reducer (state = initialState, action: any): ISystemConfiguration {
  switch (action.type) {
    case CONFIG_ACTION.SET_CONFIGS:
      return action.data
    case CONFIG_ACTION.SET_CONFIG:
      return {
        ...state,
        [action.data.section]: action.data.value,
      }
    default:
      return {
        ...state,
      }
  }
}
