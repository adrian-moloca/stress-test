import { getReadableErrorMessage } from 'utilities/misc'
import { tEvaluateNamedExpressionData, tExecuteQueryData } from '@smambu/lib.constants'
import { urClient } from 'api/apiClient'

export class ExpressionsApi {
  static async executeQuery (data: tExecuteQueryData) {
    return urClient
      .post('/executeQuery', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async evaluateNamedExpression (data: tEvaluateNamedExpressionData) {
    return urClient
      .post('/evaluateNamedExpression', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
