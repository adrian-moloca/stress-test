import { I_PERMISSIONS_DOMAINS_SCOPES } from '../permissions'
import { tExpression } from './expressions'

export type tHasCapabilityExpression = {
  expressionKind: 'hasCapability'
  capability: string
}

export type tHasScopeExpression = {
  expressionKind: 'hasScope'
  capability: string
  scope: I_PERMISSIONS_DOMAINS_SCOPES
}

export type tHasOwnerInCapabilityExpression = {
  expressionKind: 'hasOwnerInCapability'
  scope: I_PERMISSIONS_DOMAINS_SCOPES
  capability: string
  ownerId: tExpression
}

export const PERMISSIONS_OPERATORS = {
  hasCapability: 'hasCapability',
  hasScope: 'hasScope',
  hasOwnerInCapability: 'hasOwnerInCapability',
} as const

export type tPermissionsOperators = keyof typeof PERMISSIONS_OPERATORS

export type tPermissionsExpression = tHasCapabilityExpression |
  tHasScopeExpression |
  tHasOwnerInCapabilityExpression
