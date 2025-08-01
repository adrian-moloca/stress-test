import { de, enUS } from 'date-fns/locale'
import { english, german } from './locales'
import { format, Locale } from 'date-fns'
import { TranslatorLanguages } from './enums'

export type TranslatorLanguage = keyof typeof TranslatorLanguages

const replacer = (string = '', props: Record<string, string> = {}) =>
  string.replace(/{{[a-zA-Z0-9._]*}}/g, match =>
    !match.includes('.')
      ? props[match.replace(/{|}/g, '')] ?? match
      : match
        .replace(/{|}/g, '')
        .split('.')
        .reduce((prev: Record<string, string> | string, curr: string) => {
          if (!prev) return props[curr]
          if (typeof prev === 'string') return prev
          return prev?.[curr] ?? ''
        }, '') ?? match)

export class Translator {
  language: Record<string, string> = english
  languageString: TranslatorLanguage = 'en'
  unmatchedLabels: Set<unknown>
  printUnmatchedLabels: boolean

  constructor (languageString: string | null) {
    this.setLanguage(languageString)

    this.unmatchedLabels = new Set()
    this.printUnmatchedLabels = false // set to true to debug missing label
  }

  setLanguage = (languageString: string | null) => {
    switch (languageString) {
      case TranslatorLanguages.de:
        this.language = german
        this.languageString = TranslatorLanguages.de
        break

      case TranslatorLanguages.en:
        this.language = english
        this.languageString = TranslatorLanguages.en
        break

      // no default
      // we don't set a default because we specifically want the translator to
      // break if no language has been set.
      // this is a specific case to prevent the backend from using a
      // wrongly-initialized translator by accident, i.e. without using the
      // appropriate environment configuration
    }
  }

  getLanguageString = (): TranslatorLanguage => this.languageString

  fromLabel = (label: string, props?: Record<string, string>) => {
    // this should never happen in the frontend, it's here to avoid "wild" use
    // in the backend
    if (this.language === null) throw new Error('no language set')

    const requestedLabel = this.language[label]
    const labelMissing = requestedLabel === null || requestedLabel === undefined

    const missingProps = props === null || props === undefined

    if (labelMissing) {
      if (this.printUnmatchedLabels) {
        this.unmatchedLabels.add(label)
        // eslint-disable-next-line no-console
        console.log('unmatchedLabels', this.unmatchedLabels)
      }

      return missingProps ? label : JSON.stringify({ label, ...props })
    }

    if (missingProps) return requestedLabel

    return replacer(requestedLabel, props)
  }

  getLanguageTab = () => this.language

  getLocaleFromLanguage = () => {
    switch (this.languageString) {
      case TranslatorLanguages.en:
        return enUS

      case TranslatorLanguages.de:
        return de

      default:
        return enUS
    }
  }

  formatWithLocale = (
    date: Date | number,
    f: string,
    options?: {
      locale?: Locale
      weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
      firstWeekContainsDate?: number
      useAdditionalWeekYearTokens?: boolean
      useAdditionalDayOfYearTokens?: boolean
    },
  ) => {
    return format(date, f, { ...options, locale: this.getLocaleFromLanguage() })
  }
}

export default Translator
