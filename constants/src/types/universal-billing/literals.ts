import { tTranslatableString } from './base-types'
import { tExpression } from './expressions'
import {
  tAddressTypeValue,
  tBooleanTypeValue,
  tDateWithoutTimestampValue,
  tEmailValue,
  tEnumValue,
  tLiteralListValue,
  tLiteralObjValue,
  tNumberTypeValue,
  tPositiveNUmberValue,
  tPositivePriceValue,
  tPriceValue,
  tStringTypeValue,
  tTextWithPatternValue,
  tTimestampValue,
  tTwoDecimalNumberValue,
  tUniqueIdValue,
  tUserValue
} from './type-values'

export type tStringLiteral = {
  expressionKind: 'literalString'
  value: tStringTypeValue
}

export type tNumberLiteral = {
  expressionKind: 'literalNumber'
  value: tNumberTypeValue
}

export type tBooleanLiteral = {
  expressionKind: 'literalBoolean'
  value: tBooleanTypeValue
}

export type tDateLiteral = {
  expressionKind: 'literalDate'
  value: string
}

export type tEnumLiteral = {
  expressionKind: 'literalEnum'
  value: tEnumValue
}

// Deve essere omogeno
export type tLiteralList = {
  expressionKind: 'literalList'
  value: tLiteralListValue
}

export type tLiteralListOfExpressions = {
  expressionKind: 'literalListOfExpressions'
  value: tExpression[]
}

export type tObjectLiteral = {
  expressionKind: 'literalObj'
  value: tLiteralObjValue
}

export type tObjectOfExpressionsContent = {
  [key: string]: tExpression
}

export type tObjectOfExpressions = {
  expressionKind: 'objectOfExpressions'
  value: tObjectOfExpressionsContent
}

export type tAddressLiteral = {
  expressionKind: 'literalAddress'
  value: tAddressTypeValue
}

export type tDateWithoutTimestampLiteral = {
  expressionKind: 'literalDateWithoutTimestamp'
  value: tDateWithoutTimestampValue
}

export type tPriceLiteral = {
  expressionKind: 'literalPrice'
  value: tPriceValue
}

export type tPositivePriceLiteral = {
  expressionKind: 'literalPositivePrice'
  value: tPositivePriceValue
}

export type tTimestampLiteral = {
  expressionKind: 'literalTimestamp'
  value: tTimestampValue
}

export type tPositiveNumberLiteral = {
  expressionKind: 'literalPositiveNumber'
  value: tPositiveNUmberValue
}

export type tTwoDecimalsNumberLiteral = {
  expressionKind: 'literalTwoDecimalsNumber'
  value: tTwoDecimalNumberValue
}

export type tLocalizedTextLiteral = {
  expressionKind: 'literalLocalizedText'
  value: tTranslatableString | tExpression
}

export type tTextWithPatternLiteral = {
  expressionKind: 'literalTextWithPattern'
  value: tTextWithPatternValue
}

export type tEmailLiteral = {
  expressionKind: 'literalEmail'
  value: tEmailValue
}

export type tUserLiteral = {
  expressionKind: 'literalUser'
  value: tUserValue
}

export type tUniqueIdLiteral = {
  expressionKind: 'literalUniqueId'
  value: tUniqueIdValue
}

export type tNoneLiteral = {
  expressionKind: 'literalNone'
}

export const LITERAL_OPERATORS = {
  literalString: 'literalString',
  literalNumber: 'literalNumber',
  literalBoolean: 'literalBoolean',
  literalDate: 'literalDate',
  literalEnum: 'literalEnum',
  literalList: 'literalList',
  literalListOfExpressions: 'literalListOfExpressions',
  literalObj: 'literalObj',
  objectOfExpressions: 'objectOfExpressions',
  literalAddress: 'literalAddress',
  literalDateWithoutTimestamp: 'literalDateWithoutTimestamp',
  literalPrice: 'literalPrice',
  literalPositivePrice: 'literalPositivePrice',
  literalTimestamp: 'literalTimestamp',
  literalPositiveNumber: 'literalPositiveNumber',
  literalTwoDecimalsNumber: 'literalTwoDecimalsNumber',
  literalLocalizedText: 'literalLocalizedText',
  literalTextWithPattern: 'literalTextWithPattern',
  literalEmail: 'literalEmail',
  literalUser: 'literalUser',
  literalUniqueId: 'literalUniqueId',
  literalNone: 'literalNone'
} as const

export type tLiteralOperators = keyof typeof LITERAL_OPERATORS

export type tLiteralExpression = tStringLiteral |
  tNumberLiteral |
  tBooleanLiteral |
  tDateLiteral |
  tEnumLiteral |
  tLiteralList |
  tLiteralListOfExpressions |
  tObjectOfExpressions |
  tObjectLiteral |
  tAddressLiteral |
  tDateWithoutTimestampLiteral |
  tPriceLiteral |
  tPositivePriceLiteral |
  tTimestampLiteral |
  tPositiveNumberLiteral |
  tTwoDecimalsNumberLiteral |
  tLocalizedTextLiteral |
  tTextWithPatternLiteral |
  tEmailLiteral |
  tUserLiteral |
  tUniqueIdLiteral |
  tNoneLiteral
