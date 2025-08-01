import { nanoid } from 'nanoid'
import { CurrencySymbol, CurrencySymbols, IToast } from '@smambu/lib.constants'
import { GLOBAL_ACTION } from 'store/actions'
import { isValid, startOfDay } from 'date-fns'

interface GlobalState {
  loading: string[]
  toasts: IToast[]
  selectedDate: Date
  drawerOpen: boolean
  currencySymbol: CurrencySymbol
  fullScreen: boolean
  fullScreenEnabled: boolean
  selectedOrIds: string[] | null
}

const initialState: GlobalState = {
  loading: ['onStart'],
  toasts: [],
  selectedDate: startOfDay(new Date()),
  drawerOpen: false,
  currencySymbol: CurrencySymbols.EUR as CurrencySymbol,
  fullScreen: false,
  fullScreenEnabled: false,
  selectedOrIds: null,
}

export default function reducer (state = initialState, action: any) {
  switch (action.type) {
    case GLOBAL_ACTION.START_LOADING:
      return {
        ...state,
        loading: [...state.loading, action.data],
      }

    case GLOBAL_ACTION.STOP_LOADING:
      return {
        ...state,
        loading: state.loading.filter((item: string) => item !== action.data),
      }

    case GLOBAL_ACTION.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, { ...action.data, id: nanoid() }],
      }

    case GLOBAL_ACTION.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((item: IToast) => item.id !== action.data.id),
      }

    case GLOBAL_ACTION.SET_SELECTED_DATE:
      return {
        ...state,
        selectedDate: isValid(action.data) ? startOfDay(action.data) : state.selectedDate,
      }

    case GLOBAL_ACTION.SET_OR_IDS:
      return {
        ...state,
        selectedOrIds: action.data,
      }

    case GLOBAL_ACTION.TOOGLE_DRAWER_STATUS:
      return {
        ...state,
        drawerOpen: !state.drawerOpen,
      }

    case GLOBAL_ACTION.SET_APP_CURRENCY_SYMBOLS:
      return {
        ...state,
        currencySymbol: action.data,
      }

    case GLOBAL_ACTION.TOGGLE_FULL_SCREEN:
      return {
        ...state,
        fullScreen: !state.fullScreen,
      }

    case GLOBAL_ACTION.TOGGLE_ENABLED_FULL_SCREEN:
      return {
        ...state,
        fullScreenEnabled: !state.fullScreenEnabled,
      }

    default:
      return state
  }
}
