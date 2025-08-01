import { tField, tFieldDefinition } from './fields'
import { tExpression, tTypedExpression } from './expressions'
import {
  tQueryExpression,
  tQueryResultsSelectorExpression,
  tSupportedQueriesCollections,
} from './query'
import { tSupportedLocales } from './misc'

export type tNumberType = {
  kind: 'number'
}

export type tStringType = {
  kind: 'string'
}

export type tBooleanType = {
  kind: 'boolean'
}

export type tDateType = {
  kind: 'date'
}

export type tList = {
  kind: 'list'
  itemType: tFieldDefinition
  distinct?: tExpression[]
}

export type tObjectContent = {
  [key: string]: tFieldDefinition
}

export type tObject = {
  kind: 'object'
  object: tObjectContent
}

export type tEnumOption = tExpression

export type tEnum = {
  kind: 'enum'
  options: tEnumOption
}

export type tAny = {
  kind: 'any'
}

export type tTranslatableString = {
  [locale in tSupportedLocales]?: string
}

export type tFunctionType = {
  kind: 'function'
}

export type tForEachType = {
  kind: 'forEach'
  query: tQueryExpression<tSupportedQueriesCollections>
  emit: Record<string, tField>
  // Note: we use an expression rather than a "normal" field to allow for some
  // versatility later on, e.g. make this conditional or dependant on some
  // permissions
  prepopulate: tTypedExpression<tBooleanType>
  // TODO: we will need to add the concept of "key" (i.e. like in react)
  // to correctly identify an element in the emitted result.
  // It will be better to do this soon rather than later, to avoid bugs later on
}

export type tFromQueryResults = {
  kind: 'fromQuery'
  query: tQueryResultsSelectorExpression<tSupportedQueriesCollections, 'exactlyOne'>
}
