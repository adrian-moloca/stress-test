import { tCondition, tExpression, tTypedExpression } from './expressions'
import { tField, tRepresentation } from './fields'
import { tDocumentTypes } from './billing-config/invoice-types'
import { tStringType, tTranslatableString } from './base-types'
import { tValidEventName } from './local-events'

export type tTrigger = {
  eventType: tValidEventName
  // To better identify the trigger
  name?: tTranslatableString
  // TODO: Note for the future:
  // This condition is a "scoped" one, with "before" and "after" available
  // as symbols. The names could be different, but the concept is the same.
  // When we'll have the "scoped" expression this must be changed
  condition: tCondition

  // TODO: Note for the future:
  // This will probably become a more "typed" expression once we have the overall
  // infrastructure and mechanism to do so - i.e. it will include more info on
  // how the emitted "context shape", and so on.
  // XXX We could name this just 'emit', but it will break the mongoschema
  // since it is a reserved word - so to avoid mistakes, it is better to keep
  // everything aligned
  emitExpression: tExpression
  contextKey: tTypedExpression<tStringType>
}

export type tBillableCondition = {
  condition: tCondition
  // TODO: The name is willingly generic so that its purpose remains clear
  // at the moment. In the near future, once we decide how we are actually going
  // to threat this, we'll rename it accordingly.
  message: tTranslatableString
}

export type tDomain = {
  domainId: string
  domainName: tTranslatableString
  domainDescription: tTranslatableString
  trigger: tTrigger
  proxyFields: tField[]
  documentTypes: tDocumentTypes[]
  proxyDetails: tRepresentation
  proxyTable: tRepresentation
  proxyBillableCondition?: tBillableCondition[]
  canAccessProxies: tCondition
  canAccessProxyDetails: tCondition
  canEditProxy: tCondition
}

export type tBillingConfig = {
  domains: tDomain[]
  // TODO: Note for the future:
  // this will have some extra config fields, to allow some special cases
  // (like the sammel articles) to fit in this model seamlessly
}

export const URConfigs = {
  BILLING_CONFIG: 'billingConfigs',
  DYNAMIC_DATA: 'dynamicDataConfigs',
} as const

export type tURConfigKeys = (typeof URConfigs)[keyof typeof URConfigs]

export type tURConfigsData = {
  version: string
} & {
  // TODO: ref #1155, type better with billingconfig and dynamicdata when they are well-defined
  // and tested
  [K in tURConfigKeys]: unknown
}

export type tVersionlessURConfigsData = {
  // TODO: ref #1155, type better when all the structures are well-known and tested
  [K in tURConfigKeys]: unknown
}

export type tURConfigsDocuments = {
  [K in tURConfigKeys]: {
    data: tURConfigsData[K]
    createdAt: string
    updatedAt: string
  }
} & {
  updatedAt: string
  version: string
}

export const VERSIONS_NAMES = {
  LATEST: 'latest',
} as const
