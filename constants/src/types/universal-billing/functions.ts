import { concatSignature, tConcatInvocationExpression } from './applied-functions/concat'
import { tFieldType } from './fields'
import { tExpression } from './expressions'
import { mapSignature, tMapInvocationExpression } from './applied-functions/map'
import { filterSignature, tFilterInvocationExpression } from './applied-functions/filter'
import { parsePatternSignature, tParsePatternInvocationExpression } from './applied-functions/parsePattern'
import { arrayLengthSignature, tArrayLengthInvocationExpression } from './applied-functions/arrayLength'
import { concatArraySignature, tConcatArrayInvocationExpression } from './applied-functions/concatArray'
import { uniqueSignature, tUniqueInvocationExpression } from './applied-functions/unique'
import { everySignature, tEveryInvocationExpression } from './applied-functions/every'
import { objectValuesSignature, tObjectValuesInvocationExpression } from './applied-functions/objectValues'

// TODO: Note for the future:
// This is not the "final" list of supported functions. Once we fully implement
// this three, we should be able to add (relatively) quickly any needed function
// e.g. string manipulation, number manipulation, and so on
export const SUPPORTED_FUNCTIONS = {
  arrayLength: arrayLengthSignature,
  concat: concatSignature,
  concatArray: concatArraySignature,
  every: everySignature,
  map: mapSignature,
  filter: filterSignature,
  objectValues: objectValuesSignature,
  parsePattern: parsePatternSignature,
  unique: uniqueSignature
} as const

export type tSupportedFunctionsNames = keyof typeof SUPPORTED_FUNCTIONS

export type tFunctionArgs = {
  [key: string]: {
    argType: tFieldType
  }
}

export type tFunctionSignature = {
  args: tFunctionArgs
  returnType: tFieldType
}

export type tSupportedFunctionArgs<T extends tSupportedFunctionsNames> = keyof typeof SUPPORTED_FUNCTIONS[T]['args']

export type tFunctionInvocationParams<T extends tSupportedFunctionsNames> = {
  [K in tSupportedFunctionArgs<T>]: tExpression
}

export type tFunctionInvocation<T extends tSupportedFunctionsNames> = {
  expressionKind: 'functionInvocation';
  function: T;
  parameters: tFunctionInvocationParams<T>
}

export type tFunctionsSignaturesMap = {
  [key in tSupportedFunctionsNames]: tFunctionSignature
}

export type tSupportedFunctionInvocationsExpressions = tConcatInvocationExpression |
  tConcatArrayInvocationExpression |
  tMapInvocationExpression |
  tEveryInvocationExpression |
  tFilterInvocationExpression |
  tObjectValuesInvocationExpression |
  tParsePatternInvocationExpression |
  tArrayLengthInvocationExpression |
  tUniqueInvocationExpression
