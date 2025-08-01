import { tConcatInvocationExpression, tEveryInvocationExpression, tObjectValuesInvocationExpression, tParsePatternInvocationExpression } from '../applied-functions'
import { tFilterInvocationExpression } from '../applied-functions/filter'
import { tMapInvocationExpression } from '../applied-functions/map'
import { tExpression } from '../expressions'
import { eLambda } from './unaryCreators'

export const eFilter = (
  sourceArray: tExpression,
  callback: tExpression,
): tFilterInvocationExpression => {
  return {
    expressionKind: 'functionInvocation',
    function: 'filter',
    parameters: {
      sourceArray,
      callback: eLambda(callback)
    }
  }
}

export const eConcat = (stringsToConcat: tExpression[]): tConcatInvocationExpression => {
  return {
    expressionKind: 'functionInvocation',
    function: 'concat',
    parameters: {
      stringsToConcat: {
        expressionKind: 'literalListOfExpressions',
        value: stringsToConcat
      }
    }
  }
}

export const eMap = (
  sourceArray: tExpression,
  callback: tExpression,
): tMapInvocationExpression => {
  return {
    expressionKind: 'functionInvocation',
    function: 'map',
    parameters: {
      sourceArray,
      callback: eLambda(callback)
    }
  }
}

export const eObjectValues = (object: tExpression): tObjectValuesInvocationExpression => {
  return {
    expressionKind: 'functionInvocation',
    function: 'objectValues',
    parameters: { object }
  }
}

export const eEvery = (
  sourceArray: tExpression,
  callback: tExpression,
): tEveryInvocationExpression => {
  return {
    expressionKind: 'functionInvocation',
    function: 'every',
    parameters: {
      sourceArray,
      callback: eLambda(callback)
    }
  }
}

export const eParsePattern = (forbiddenTokens: string[]): tParsePatternInvocationExpression => {
  return {
    expressionKind: 'functionInvocation',
    function: 'parsePattern',
    parameters: {
      pattern: {
        expressionKind: 'symbolOperator',
        name: 'current'
      },
      forbiddenTokens: {
        expressionKind: 'literalList',
        value: forbiddenTokens
      }
    }
  }
}
