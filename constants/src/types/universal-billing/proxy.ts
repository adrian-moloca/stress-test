import { tDynamicChanges } from './dynamic-entities'
import { tCondition } from './expressions'
import { tSupportedValue } from './type-values'

// TODO: in the future, it will be nice to have some sort of "type hint" to
// correctly determine the shape of the context
export type tContext = {
  [key: string]: tSupportedValue
}

// dovrebbe essere a posto
export type tFragments = {
  [key: string]: tSupportedValue
}

export type tProxyDynamicFields = Record<string, unknown>

export type tProxy = {
  // TODO: ref #1155, the id field is very likely no longer necessary.
  // Do some small analysis and remove it if that turns out to be the case
  id: string
  context: tContext
  contextKey: string
  fragments?: tFragments
  domainId: string
  dynamicFields: tProxyDynamicFields
}

export type tProxyListRequest = {
  domainId: string
  page: number
  pageSize: number
}

// XXX This is an alias to indicate a generic "proxy slice or portion", which
// will eventually be perfected.
// It will probably involve some digging inside the dynamic fields or fragments
// in order to define the slice, in addition to the static fields.
export type tProxySlice = tProxy

export type tProxyPaginatedResult = {
  data: tProxySlice[]
  total: number
  totalPages: number
}

// TODO: ref 1155, add a "real" type if and when we can define one
export type tProxyFieldMetadata = Record<string, unknown>

export type tUpdateProxyPayload = {
  proxy: tProxy
  // TODO: ref 1155, add a "real" type if and when we can define one
  metadata: tProxyFieldMetadata
  changesMap: tDynamicChanges
}

// TODO: ref 1155, add a "real" type if and when we can define one
export type tProxyFieldsValueUpdate = {
  [completePath: string]: unknown
}

export type tParsedUpdateProxyPayload = {
  updatedFieldsValues: tProxyFieldsValueUpdate
  // TODO: ref #1436
  fragments?: tFragments
}

export type tProxyPermissionsObject = {
  canAccessProxies: tCondition
  canAccessProxyDetails: tCondition
  canEditProxy: tCondition
}
export const PROXY_PERMISSIONS = {
  CAN_ACCESS_PROXIES: 'CAN_ACCESS_PROXIES',
  CAN_ACCESS_PROXY_DETAILS: 'CAN_ACCESS_PROXY_DETAILS',
  CAN_EDIT_PROXY: 'CAN_EDIT_PROXY'
} as const

export type tProxyPermissionsValues = typeof PROXY_PERMISSIONS[keyof typeof PROXY_PERMISSIONS]
