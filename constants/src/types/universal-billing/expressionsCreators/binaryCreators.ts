import { tBooleanType, tStringType } from '../base-types'
import { tTypedExpression } from '../expressions'

export const eStartsWith = (
  left: tTypedExpression<tStringType>,
  right: tTypedExpression<tStringType>
): tTypedExpression<tBooleanType> => {
  return {
    expressionKind: 'startsWithOperator',
    left,
    right,
    typeHint: { kind: 'boolean' },
  }
}
