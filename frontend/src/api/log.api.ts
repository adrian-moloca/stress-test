import { AxiosCancellationError, QueryAuditTrailDto, QueryLogDto } from '@smambu/lib.constants'
import { logClient } from './apiClient'

export class LogApi {
  static async getAuditTrails (queries?: QueryAuditTrailDto, abortController?: AbortController) {
    try {
      const res = await logClient.get('/audit-trails', {
        params: { ...queries },
        signal: abortController?.signal,
      })
      return res.data
    } catch (err) {
      if (abortController?.signal.aborted) throw new AxiosCancellationError()
      else throw err
    }
  }

  static async getLogs (queries?: QueryLogDto, abortController?: AbortController) {
    try {
      const res = await logClient.get('/logs', {
        params: { ...queries },
        signal: abortController?.signal,
      })
      return res.data
    } catch (err) {
      if (abortController?.signal.aborted) throw new AxiosCancellationError()
      else throw err
    }
  }
}
