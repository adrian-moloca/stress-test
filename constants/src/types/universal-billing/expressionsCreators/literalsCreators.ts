import { tBooleanType } from '../base-types'
import { tTypedExpression } from '../expressions'

export const eTrue = { expressionKind: 'literalBoolean', value: true, typeHint: { kind: 'boolean' } } as tTypedExpression<tBooleanType>
export const eFalse = { expressionKind: 'literalBoolean', value: false, typeHint: { kind: 'boolean' } } as tTypedExpression<tBooleanType>
