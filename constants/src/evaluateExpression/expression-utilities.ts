import { tExpressionResult } from '../types'

export const expressionHasErrors = (result: tExpressionResult) => {
  const hasError = result.error != null && result.error !== ''

  return hasError
}
