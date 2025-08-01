import { TranslatorLanguages } from '../enums'
import { english, german } from '../locales'

export const getLanguageFromString = (language: string) => {
  switch (language) {
    case TranslatorLanguages.en:
      return english

    case TranslatorLanguages.de:
      return german

    default:
      return english
  }
}
