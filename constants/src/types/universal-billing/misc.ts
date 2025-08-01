import { tExpression, tExpressionResult } from './expressions'
import { PROXY_PERMISSIONS } from './proxy'

export const SUPPORTED_LOCALES = {
  en: 'en_US',
  de: 'de_DE'
} as const

export type tSupportedLocales = keyof typeof SUPPORTED_LOCALES

export type tTest = {
  data: tExpression,
  expected?: tExpressionResult,
  error?: boolean, // if true we expect an error from the evaluation
  impure?: boolean, // if true we expect the result to be different from the expected
}
export type tTestError = {
  fileId: string;
  testIndex: string;
  result: tExpressionResult;
  expected: tExpressionResult,
  expectedError: boolean | undefined,
  impure?: boolean,
}

export type tScope = Record<string, unknown> & {
  self?: Record<string, unknown>
}

export type tTriggersQueueJobResult = {
  newProxiesIds: string[]
}

export type tTriggerFailureReason = {
  id: string
  tenantId: string
  reason: string
}

export const SCOPEABLE_TARGET = {
  ...PROXY_PERMISSIONS
} as const

export type tScopeableTarget = typeof SCOPEABLE_TARGET[keyof typeof SCOPEABLE_TARGET]
