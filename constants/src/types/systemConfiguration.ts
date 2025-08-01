import { systemConfigurationSections } from '../enums'
import { TranslatorLanguage } from './global'

export const defaultNumberConfig = '{number}'

export type onSystemConfigurationChange = (tab: systemConfigurationSections,
  key: string | null,
  value: any) => void

export type ISystemConfigurationField = {
  key: string
  type: 'number' | 'text'
  required?: boolean
  endAdornment?: string
  defaultValue?: string
}

export type ISystemConfigurationVatValueRow = {
  id: string
  fullPercentage: number
  halfPercentage: number
  validFrom: Date
}

export type ISystemConfigurationNumbersConfigs = Record<string, string>

export type ISystemConfigurationRevenueAccountRow = {
  categoryId: string
  revenueAccount: string
  creditNoteAccount: string
  costCenter: string
}

export type tSystemEnvironmentConfig = {
  language: TranslatorLanguage
  currency: CurrencySymbol
}

export type ISystemConfiguration = {
  [systemConfigurationSections.FILE_CONFIGS]: {
    numberUploadLimit: number
    sizeUploadLimit: number
  }
  [systemConfigurationSections.PRICE_POINT_CONFIGS]: {
    pricePoint: number
  }
  [systemConfigurationSections.SUBJECT_AREAS]: string[]
  [systemConfigurationSections.CASE_NUMBERS_CONFIGS]: ISystemConfigurationNumbersConfigs
  [systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS]: ISystemConfigurationNumbersConfigs
  [systemConfigurationSections.PATIENT_NUMBERS_CONFIGS]: ISystemConfigurationNumbersConfigs
  [systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS]: ISystemConfigurationNumbersConfigs
  [systemConfigurationSections.SUPPLIER_CODES]: string[]
  [systemConfigurationSections.COUNT_CONTROL]: string[]
  [systemConfigurationSections.GENERAL_DATA]: Record<string, string>
  [systemConfigurationSections.ENVIRONMENT_CONFIG]: tSystemEnvironmentConfig
}

export const CurrencySymbols = {
  USD: '$',
  EUR: '€',
}
export type CurrencySymbol = keyof typeof CurrencySymbols
