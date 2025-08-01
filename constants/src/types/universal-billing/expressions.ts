import { tFieldType } from './fields'
import { tLiteralExpression } from './literals'
import { tSupportedFunctionInvocationsExpressions } from './functions'
import type { tQueryExpressions } from './query'
import { tBooleanType, tTranslatableString } from './base-types'
import { tHttpExpression } from './httpQuery'
import { tAddressTypeValue, tTimestampValue, tUserValue } from './type-values'
import { Document, RootFilterQuery } from 'mongoose'
import { tPermissionsExpression } from './permissions'
import { tNamedExpression } from './namedExpressions'

export const BINARY_OPERATORS = {
  equalsOperator: 'equalsOperator',
  notEqualsOperator: 'notEqualsOperator',
  greaterThanOperator: 'greaterThanOperator',
  lessThanOperator: 'lessThanOperator',
  greaterOrEqualsThanOperator: 'greaterOrEqualsThanOperator',
  lessOrEqualsOperator: 'lessOrEqualsOperator',
  sumOperator: 'sumOperator',
  differenceOperator: 'differenceOperator',
  productOperator: 'productOperator',
  divisionOperator: 'divisionOperator',
  containsStringOperator: 'containsStringOperator',
  startsWithOperator: 'startsWithOperator',
  endsWithOperator: 'endsWithOperator',
  includesOperator: 'includesOperator'
} as const

export type tBinaryOperators = keyof typeof BINARY_OPERATORS

export type tBinaryExpression = {
  expressionKind: tBinaryOperators
  left: tExpression
  right: tExpression
}

export const UNARY_OPERATORS = {
  isUndefinedOperator: 'isUndefinedOperator',
  notOperator: 'notOperator',
  dotOperator: 'dotOperator',
  selfOperator: 'selfOperator',
  symbolOperator: 'symbolOperator',
  tryOperator: 'tryOperator',
  errorOperator: 'errorOperator',
  warningOperator: 'warningOperator',
  lambdaOperator: 'lambdaOperator',
  andOperator: 'andOperator',
  orOperator: 'orOperator',
  ruleOperator: 'ruleOperator',
  rulesOperator: 'rulesOperator'
} as const

export type tUnaryOperators = keyof typeof UNARY_OPERATORS

export type tUnaryExpression =
  tIsUndefinedExpression |
  tNotExpression |
  tDotExpression |
  tSelfExpression |
  tSymbolExpression |
  tTryExpression |
  tErrorExpression |
  tWarningExpression |
  tLambdaExpression |
  tAndExpression |
  tOrExpression |
  tRuleExpression |
  tRulesExpression

export type tIsUndefinedExpression = {
  expressionKind: 'isUndefinedOperator'
  args: tExpression
}

export type tNotExpression = {
  expressionKind: 'notOperator'
  args: tExpression
}

export type tDotExpression = {
  expressionKind: 'dotOperator'
  source: tExpression
  paths: (string | number)[] | tExpression
}

export type tSelfExpression = {
  expressionKind: 'selfOperator'
  paths: (string | number)[]
}

export type tSymbolExpression = {
  expressionKind: 'symbolOperator'
  name: string
}

export type tTryExpression = {
  expressionKind: 'tryOperator'
  try: tExpression
  catch: tExpression
}

export type tErrorExpression = {
  expressionKind: 'errorOperator'
  message: tTranslatableString
}

export type tWarningExpression = {
  expressionKind: 'warningOperator'
  message: tTranslatableString
  value: tExpression
}

// TODO: Note for the future:
// While this is (probably) not needed right now, we might need to add a "pipe"
// operator or expression. This is just a tentative type, left here to give an
// initial "direction" to a further development, or just as a reminder
// export type tPipe = {
//   expressionKind: 'pipe'
//   prev?: tExpression
//   next: tExpression
// }

export type tLambdaExpression = {
  expressionKind: 'lambdaOperator'
  args: string[]
  body: tExpression
}

export type tAndExpression = {
  expressionKind: 'andOperator'
  args: tExpression[]
}

export type tOrExpression = {
  expressionKind: 'orOperator'
  args: tExpression[]
}

export type tRuleExpression = {
  expressionKind: 'ruleOperator'
  condition: tCondition
  then: tExpression | tErrorExpression | tWarningExpression
}

export type tRulesExpression = {
  expressionKind: 'rulesOperator'
  rules: tRuleExpression[]
  else: tExpression | tErrorExpression | tWarningExpression
}

// Clarification: this an optional (but very appreciated) field thought to
// accomodate a "natural language" description of what a particular expression
// is supposed to do.
// This (if populateds), has multiple purposes:
// - it gives a better (and quicker) "look" to the json, for a second reader;
// - it can be shown in a "dedicated" ui component (e.g. a popover),
// to better explain a configuration;
// - it could be used to train an AI model (in the future)
export type tNaturalLanguageDescription = {
  description?: tTranslatableString
}

export type tTypeHint<T> = {
  typeHint?: T
}

export type tExpression = (
  tLiteralExpression |
  tBinaryExpression |
  tUnaryExpression |
  tSupportedFunctionInvocationsExpressions |
  tQueryExpressions |
  tRulesExpression |
  tHttpExpression |
  tNamedExpression |
  tPermissionsExpression
) &
  tTypeHint<tFieldType> &
  tNaturalLanguageDescription

export type tTypedExpression<T> = tExpression & Required<tTypeHint<T>>

// TODO: Note for the future:
// we are creating a "type alias" so that we could use a more "readable"
// version of the same type - allowing the code to be more readable.
// But wait, there's more! We might edit this in the near future, so we can
// have the "updated" version of this type all around without having to refactor
// anything!
export type tCondition = tTypedExpression<tBooleanType>

export type tDepDetails = RootFilterQuery<Document>

export type tSimpleDeps = { path: string, details?: tDepDetails }

export type tDeps = tSimpleDeps[]

export type tEmits = tSimpleDeps[]

export type tWarnings = string[]

export type tEmissions = {
  deps: tDeps
  emits: tEmits
}

export type tDependentValue = {
  value: string | number | boolean | null | undefined |
    tDependentValue | tDependentValue[] | Record<string, tDependentValue> |
    Date | tAddressTypeValue | tTimestampValue | tUserValue | any
  deps: tDeps | null // null means it has to use the parent's deps, that have to be of length 1
  emits: tEmits
}

export type tExpressionResult<T = unknown> = {
  value: T,
  emits: tEmits,
  warnings?: tWarnings,
  stack?: string[],
  error?: string,
}

export type tDependencyMap = {
  [path: string]: tDepDetails | undefined
}
