import { DYNAMIC_DATA_CONFIGS } from 'store/actions'
import { tAnagraphicsDynamicData, tDynamicCapabilities, tDynamicDataList } from '@smambu/lib.constants'

const initialState: tDynamicDataList = {
  contracts: {},
  opStandards: {},
  cases: {},
  anagraphics: [] as tAnagraphicsDynamicData,
  capabilities: [] as tDynamicCapabilities
} as tDynamicDataList

export default function reducer (state = initialState, action: any): tDynamicDataList {
  switch (action.type) {
    case DYNAMIC_DATA_CONFIGS.SET_ALL_DYNAMIC_DATA:
      return action.data

    case DYNAMIC_DATA_CONFIGS.SET_CONTRACTS_DD:
      return {
        ...state,
        contracts: action.data.value,
      }

    case DYNAMIC_DATA_CONFIGS.SET_OPSTANDARDS_DD:
      return {
        ...state,
        opStandards: action.data.value,
      }

    case DYNAMIC_DATA_CONFIGS.SET_CASES_DD:
      return {
        ...state,
        cases: action.data.value,
      }

    case DYNAMIC_DATA_CONFIGS.SET_ANAGRAPHICS_DD:
      return {
        ...state,
        anagraphics: action.data.value,
      }

    case DYNAMIC_DATA_CONFIGS.SET_CAPABILITIES_DD:
      return {
        ...state,
        contracts: action.data.value,
      }

    default:
      return {
        ...state,
      }
  }
}
