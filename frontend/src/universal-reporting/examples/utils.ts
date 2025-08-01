import { tTypedExpression, tBooleanType, tViewAs, ZeroToTwelve, tFieldRepresentation } from '@smambu/lib.constants'

export const trueExpression: tTypedExpression<tBooleanType> = {
  expressionKind: 'literalBoolean',
  value: true,
  typeHint: { kind: 'boolean' },
}
export const falseExpression: tTypedExpression<tBooleanType> = {
  expressionKind: 'literalBoolean',
  value: false,
  typeHint: { kind: 'boolean' },
}

export const hide = trueExpression
export const show = falseExpression

export const override = trueExpression
export const readonly = falseExpression

export const required = trueExpression
export const optional = falseExpression

export const createFieldRepresentation: (
  fieldId: string,
  override: tTypedExpression<tBooleanType>,
  required: tTypedExpression<tBooleanType>,
  hide: tTypedExpression<tBooleanType>,
  viewAs: tViewAs,
  span: ZeroToTwelve,
  margin: ZeroToTwelve
) => tFieldRepresentation = (
  fieldId,
  override,
  required,
  hide,
  viewAs,
  span,
  margin
): tFieldRepresentation => ({
  fieldId,
  label: { en: `${fieldId} label` },
  description: { en: `${fieldId} description` },
  override,
  required,
  hide,
  viewAs,
  span,
  margin
})
