import { Locale } from 'date-fns'
import { LANG_ACTION } from 'store/actions'
import { deDE, enUS } from '@mui/x-date-pickers'
import deLocale from 'date-fns/locale/de'
import enLocale from 'date-fns/locale/en-US'
import { TranslatorLanguage, TranslatorLanguages } from '@smambu/lib.constants'

export interface LangState {
  code: TranslatorLanguage
  adapterLocale: Locale
  localeText: any
}

const initialState: LangState = {
  code: TranslatorLanguages.en,
  adapterLocale: enLocale,
  localeText: enUS.components.MuiLocalizationProvider.defaultProps.localeText,
}

export default function reducer (state = initialState, action: any) {
  switch (action.type) {
    case LANG_ACTION.SET_LANG:
      switch (action.payload) {
        case TranslatorLanguages.en:
          return {
            ...state,
            code: TranslatorLanguages.en,
            adapterLocale: enLocale,
            localeText: enUS.components.MuiLocalizationProvider.defaultProps.localeText,
          }

        case TranslatorLanguages.de:
          return {
            ...state,
            code: TranslatorLanguages.de,
            adapterLocale: deLocale,
            localeText: deDE.components.MuiLocalizationProvider.defaultProps.localeText,
          }

        default:
          return {
            ...state,
            code: TranslatorLanguages.en,
            adapterLocale: enLocale,
            localeText: enUS.components.MuiLocalizationProvider.defaultProps.localeText,
          }
      }
    default:
      return state
  }
}
