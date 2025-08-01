import { tEnumOption } from './base-types'

export type tNumberTypeValue = number
export type tStringTypeValue = string
export type tBooleanTypeValue = boolean
export type tDateTypeValue = Date
export type tAddressTypeValue = {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export type tDateWithoutTimestampValue = {
  day: number
  month: number
  // TODO: there might a way to force this to some format, like four digits with some helping types
  year: number
}

export type tPriceValue = number

export type tPositivePriceValue = number

export type tTimestampValue = {
  hours: number
  minutes: number
  seconds: number
  milliseconds?: number
  timezone: string
}

export type tPositiveNUmberValue = number

export type tTwoDecimalNumberValue = number

export type tLocalizedTextValue = {
  key: string
  // TODO: this might be something like "supported locales" type in the future
  locale: string
}

export type tTextWithPatternValue = {
  text: string
  // TODO: a pattern that should "govern" the text, like a dateformat or something
  pattern: string
}

export type tEmailValue = string

export type tUserValue = {
  title: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  birthDate: tDateWithoutTimestampValue
  address: tAddressTypeValue
  debtorNumber: string
}

// TODO: maybe we can specify a length, or maybe we can use a textwithpattern
export type tUniqueIdValue = string

export type tEnumValue = tEnumOption

export type tLiteralObjValue = {
  [key: string]: tSupportedValue
}

export type tLiteralListValue = tSupportedValue[]

export type tForEachValue = {
  [key: string]: tSupportedValue
}

export type tFromQueryResultValue = {
  [key: string]: tSupportedValue
}

// TODO: Note for the future:
// Maybe we could do this a little better, using actual "kinds" from the
// various types to (in some way) map the keys of this object?
export type tTypesValuesMap = {
  number: tNumberTypeValue,
  string: tStringTypeValue,
  boolean: tBooleanTypeValue,
  date: tDateTypeValue,
  address: tAddressTypeValue,
  dateWithoutTimestamp: tDateWithoutTimestampValue,
  price: tPriceValue,
  positivePrice: tPositivePriceValue,
  timeStamp: tTimestampValue,
  positiveNumber: tPositiveNUmberValue,
  twoDecimalNumber: tTwoDecimalNumberValue,
  localizedText: tLocalizedTextValue,
  textWithPattern: tTextWithPatternValue,
  email: tEmailValue,
  uniqueId: tUniqueIdValue,
  enum: tEnumValue,
  user: tUserValue,
  literalObj: tLiteralObjValue,
  forEach: tForEachValue,
  fromQuery: tFromQueryResultValue,
}

export type tSupportedValue = tTypesValuesMap[keyof tTypesValuesMap];
