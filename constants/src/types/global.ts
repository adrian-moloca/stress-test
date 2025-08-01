import { OBJECT_DIFF_EVENTS, ToastType, TranslatorLanguages } from '../enums'
import { UserPermissions } from './permissions'
import { tDynamicChanges } from './universal-billing'

export interface IToastBody {
  text: string
  type: ToastType
  targetPath?: string
}

export interface IToast extends IToastBody {
  id: string
}

export type tAsyncLocalStorage = {
  tenantId?: string
  bypassTenant?: boolean
  userPermissions?: UserPermissions
  skipRWMiddleware?: boolean
  dynamicChangesMap?: tDynamicChanges
}

export type NaiveDate = string

export type TranslatorLanguage = keyof typeof TranslatorLanguages

export type tCellData = string | number | Date | boolean | undefined

export type tColumn = {
  field: string
  headerName?: string
  disableExport?: boolean
  valueFormatter?: (params: any) => any
  valueGetter?: (params: any) => any
  type: 'string' | 'number' | 'date' | 'boolean'
}

export type tTypeofStrings = 'string' |
  'number' |
  'boolean' |
  'object' |
  'undefined' |
  'function' |
  'symbol' |
  'bigint' |
  'undefined'

export type tObjectDiffEventsValues = typeof OBJECT_DIFF_EVENTS[keyof typeof OBJECT_DIFF_EVENTS]

export type tObjectDiffEvents = {
  type: tObjectDiffEventsValues
  valueBefore?: unknown
  valueAfter?: unknown
}

export type tObjectDiffReturn = {
  [path: string]: tObjectDiffEvents
}

export type tRedisLockVars = {
  retryCount: number
  lockDuration: number
  driftFactor: number
  retryDelay: number
  retryJitter: number
  automaticExtensionThreshold: number
}
