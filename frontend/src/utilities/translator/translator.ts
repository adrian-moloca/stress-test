import { PREFERRED_LOCALE, TranslatorLanguages } from '@smambu/lib.constants'
import Translator from '@smambu/lib.constants/src/translator'

const preferredLanguage = sessionStorage.getItem(PREFERRED_LOCALE) ?? TranslatorLanguages.en

const translator = new Translator(preferredLanguage)

export const trlb = translator.fromLabel
export const setAppLanguage = translator.setLanguage
export const getLanguage = translator.getLanguageString
export const formatWithLocale = translator.formatWithLocale

export default translator
