import { tTypedExpression, tExpression, tLambdaExpression, tTryExpression, tSymbolExpression } from '../expressions'
import { tBooleanType } from '../base-types'

export const eNot = (expression: tExpression): tTypedExpression<tBooleanType> => {
  return {
    expressionKind: 'notOperator',
    args: expression,
    typeHint: { kind: 'boolean' },
  }
}

export const eLambda = (callback: tExpression): tLambdaExpression => ({
  expressionKind: 'lambdaOperator',
  args: ['current'],
  body: callback
})

export const eCurrent = (): tSymbolExpression => ({
  expressionKind: 'symbolOperator',
  name: 'current'
})

export const eIsUndefined = (arg: tExpression): tTypedExpression<tBooleanType> => ({
  expressionKind: 'isUndefinedOperator',
  args: arg,
  typeHint: { kind: 'boolean' }
})

export const eTryCatch = (tryBlock: tExpression, catchBlock: tExpression): tTryExpression => {
  return {
    expressionKind: 'tryOperator',
    try: tryBlock,
    catch: catchBlock
  }
}
