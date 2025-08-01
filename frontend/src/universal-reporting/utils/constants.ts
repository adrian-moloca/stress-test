import { tTypedExpression, tBooleanType } from '@smambu/lib.constants'

export const trueExpression: tTypedExpression<tBooleanType> = {
  expressionKind: 'literalBoolean',
  value: true,
  typeHint: { kind: 'boolean' },
}
