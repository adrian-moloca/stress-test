import {
  forbiddenTokensForCases,
  forbiddenTokensForDebtors,
  forbiddenTokensForPatients,
  parsePattern,
} from '../invoicing'
import { CurrencySymbols, defaultNumberConfig, ISystemConfiguration, ISystemConfigurationField } from '../types'
import { invoiceTypesWithInvoiceNumber } from './billing'
import { TranslatorLanguages } from './others'
import { permissionRequests } from './permissions'

/* eslint-disable no-unused-vars */
export enum systemConfigurationSections {
  FILE_CONFIGS = 'fileConfigs',
  PRICE_POINT_CONFIGS = 'pricePointConfigs',
  SUBJECT_AREAS = 'subjectAreas',
  CASE_NUMBERS_CONFIGS = 'caseNumbersConfiguration',
  PC_MATERIALS_NUMBERS_CONFIGS = 'pcMaterialsNumbersConfiguration',
  PATIENT_NUMBERS_CONFIGS = 'patientNumbersConfiguration',
  DEBTOR_NUMBERS_CONFIGS = 'debtorNumbersConfiguration',
  SUPPLIER_CODES = 'supplierCodes',
  COUNT_CONTROL = 'countControl',
  GENERAL_DATA = 'generalData',
  ENVIRONMENT_CONFIG = 'environmentConfigurations',
}

export const fileConfigsFields: ISystemConfigurationField[] = [
  { key: 'numberUploadLimit', type: 'number' },
  { key: 'sizeUploadLimit', type: 'number', endAdornment: 'MB' },
]

export const pricePointConfigsFields: ISystemConfigurationField[] = [{ key: 'pricePoint', type: 'number' }]

export const generalDataFields: ISystemConfigurationField[] = [
  { key: 'companyName', type: 'text', required: true },
  { key: 'surgeryCenterName', type: 'text', required: true },
  { key: 'companyStreet', type: 'text', required: true },
  { key: 'companyHouseNumber', type: 'text', required: true },
  { key: 'companyPostalCode', type: 'text', required: true },
  { key: 'companyCity', type: 'text', required: true },
  { key: 'bankAccount', type: 'text', required: true },
  { key: 'companyTaxNumber', type: 'text', required: true },
  { key: 'companySalesTaxNumber', type: 'text', required: true },
  { key: 'companySeat', type: 'text', required: true },
  { key: 'tradeRegisterNumber', type: 'text', required: true },
  { key: 'managingDirectors', type: 'text', required: true },
  { key: 'phoneNumber', type: 'text', required: true },
  { key: 'fax', type: 'text', required: true },
]

export const invoiceNumbersConfigsFields: ISystemConfigurationField[] = Object.values(
  invoiceTypesWithInvoiceNumber,
).map(key => ({
  key: key.toLowerCase(),
  type: 'text',
  defaultValue: defaultNumberConfig,
}))

export const caseNumbersConfigsFields: ISystemConfigurationField[] = [
  { key: 'caseNumber', type: 'text', defaultValue: defaultNumberConfig },
]

export const pcMaterialsNumbersConfigsFields: ISystemConfigurationField[] = [
  { key: 'prescriptionNumber', type: 'text', defaultValue: defaultNumberConfig },
]

export const patientNumbersConfigsFields: ISystemConfigurationField[] = [
  { key: 'patientNumber', type: 'text', defaultValue: defaultNumberConfig },
]

export const debtorNumbersConfigsFields: ISystemConfigurationField[] = [
  { key: 'patientNumber', type: 'text', defaultValue: defaultNumberConfig },
  { key: 'userNumber', type: 'text', defaultValue: defaultNumberConfig },
  { key: 'thirdPartyNumber', type: 'text', defaultValue: defaultNumberConfig },
  { key: 'bgNumber', type: 'text', defaultValue: defaultNumberConfig },
]

const checkIfDuplicateFields = (fields: string[]) => fields
  ?.some((field, index) => fields.indexOf(field) !== index)

export const systemConfigurationSaveControl: Record<
  systemConfigurationSections,
  (() => true) | ((_values: any) => boolean)
> = {
  [systemConfigurationSections.FILE_CONFIGS]: () => true,
  [systemConfigurationSections.PRICE_POINT_CONFIGS]: () => true,
  [systemConfigurationSections.SUBJECT_AREAS]: (
    values: ISystemConfiguration[systemConfigurationSections.SUBJECT_AREAS],
  ) => values?.every(Boolean) && !checkIfDuplicateFields(values),
  [systemConfigurationSections.CASE_NUMBERS_CONFIGS]: (
    values: ISystemConfiguration[systemConfigurationSections.CASE_NUMBERS_CONFIGS],
  ) => {
    const [_parsedPattern, errors] = parsePattern(values?.caseNumber ?? '', forbiddenTokensForCases)
    return errors?.length === 0 || errors == null
  },
  [systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS]: (
    values: ISystemConfiguration[systemConfigurationSections.CASE_NUMBERS_CONFIGS],
  ) => {
    const [_parsedPattern, errors] = parsePattern(values?.prescriptionNumber ?? '', forbiddenTokensForCases)
    return errors?.length === 0 || errors == null
  },
  [systemConfigurationSections.PATIENT_NUMBERS_CONFIGS]: (
    values: ISystemConfiguration[systemConfigurationSections.PATIENT_NUMBERS_CONFIGS],
  ) => {
    const [_parsedPattern, errors] = parsePattern(values?.patientNumber ?? '', forbiddenTokensForPatients)
    return errors?.length === 0 || errors == null
  },
  [systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS]: (
    values: ISystemConfiguration[systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS],
  ) => {
    const [_parsedPatientPattern, patientErrors] = parsePattern(values?.patientNumber ?? '', forbiddenTokensForDebtors)
    const [_parsedThirdPartyPattern, thirdPartyErrors] = parsePattern(
      values?.thirdPartyNumber ?? '',
      forbiddenTokensForDebtors,
    )
    const [_parsedUserPattern, userErrors] = parsePattern(values?.userNumber ?? '', forbiddenTokensForDebtors)
    return (
      (patientErrors?.length === 0 || !patientErrors || !values?.patientNumber) &&
      (thirdPartyErrors?.length === 0 || !thirdPartyErrors || !values?.thirdPartyNumber) &&
      (userErrors?.length === 0 || !userErrors || !values?.userNumber)
    )
  },
  [systemConfigurationSections.SUPPLIER_CODES]: (
    values: ISystemConfiguration[systemConfigurationSections.SUPPLIER_CODES],
  ) => values?.every(Boolean) && !checkIfDuplicateFields(values),
  [systemConfigurationSections.COUNT_CONTROL]: (
    values: ISystemConfiguration[systemConfigurationSections.COUNT_CONTROL],
  ) => values?.every(Boolean) && !checkIfDuplicateFields(values),
  [systemConfigurationSections.GENERAL_DATA]: (
    values: ISystemConfiguration[systemConfigurationSections.GENERAL_DATA],
  ) => generalDataFields?.every(field => field.required && values[field.key]),
  [systemConfigurationSections.ENVIRONMENT_CONFIG]: (
    values: ISystemConfiguration[systemConfigurationSections.ENVIRONMENT_CONFIG],
  ) => {
    const translations = Object.values(TranslatorLanguages)
    const currencies = Object.values(CurrencySymbols)

    return translations.includes(values.language) && currencies.includes(values.currency)
  },
}

export const systemConfigurationPermissions = {
  [systemConfigurationSections.FILE_CONFIGS]: permissionRequests.canEditFileUploadConfigs,
  [systemConfigurationSections.PRICE_POINT_CONFIGS]: permissionRequests.canEditPricePointConfigs,
  [systemConfigurationSections.SUBJECT_AREAS]: permissionRequests.canEditSubjectAreas,
  [systemConfigurationSections.CASE_NUMBERS_CONFIGS]: permissionRequests.canEditCaseNumbersConfigs,
  [systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS]:
    permissionRequests.canEditPcMaterialsNumbersConfigs,
  // eslint-disable-next-line max-len
  [systemConfigurationSections.PATIENT_NUMBERS_CONFIGS]: permissionRequests.canEditPatientNumbersConfigs,
  // eslint-disable-next-line max-len
  [systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS]: permissionRequests.canEditDebtorNumbersConfigs,
  [systemConfigurationSections.SUPPLIER_CODES]: permissionRequests.canEditSupplierCodes,
  [systemConfigurationSections.COUNT_CONTROL]: permissionRequests.canEditCountControlConfigs,
  [systemConfigurationSections.GENERAL_DATA]: permissionRequests.canEditGeneralData,
  // eslint-disable-next-line max-len
  [systemConfigurationSections.ENVIRONMENT_CONFIG]: permissionRequests.canEditEnvironmentConfigurations,
}

export interface IGeneralData {
  companyName: string
  surgeryCenterName: string
  companyStreet: string
  companyHouseNumber: string
  companyPostalCode: string
  companyCity: string
  bankAccount: string
  companyTaxNumber: string
  companySalesTaxNumber: string
  companySeat: string
  tradeRegisterNumber: string
  managingDirectors: string
  phoneNumber: string
  fax: string
}

export interface IPricePointConfigs {
  pricePoint: number
}

export interface IVatValue {
  id: string
  fullPercentage: number
  halfPercentage: number
  validFrom: string
}
