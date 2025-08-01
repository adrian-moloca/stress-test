import { tBooleanType } from '../base-types'
import { tExpression, tTypedExpression } from '../expressions'
import { eEvery } from './functionCreators'
import { eFalse } from './literalsCreators'
import { eTryCatch } from './unaryCreators'

export const eTestArray = (
  sourceArray: tExpression,
  callback: tExpression,
): tTypedExpression<tBooleanType> => {
  return {
    ...eTryCatch(
      eEvery(
        sourceArray,
        callback
      ),
      eFalse
    ),
    typeHint: { kind: 'boolean' }
  }
}
