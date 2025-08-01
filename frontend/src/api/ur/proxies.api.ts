import { getReadableErrorMessage } from 'utilities/misc'
import { tProxy, tProxyListRequest, tProxyPaginatedResult, tUpdateProxyPayload } from '@smambu/lib.constants'
import { urClient } from 'api/apiClient'

export class ProxiesApi {
  static async getProxiesList (data: tProxyListRequest):Promise<tProxyPaginatedResult> {
    return urClient
      .post('/proxies', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getProxiesByContextKey (domainId:string, contextKey: string):Promise<tProxy> {
    const getUrl = `/proxies/${domainId}/${contextKey}`

    return urClient
      .get(getUrl)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async updateProxy (payload: tUpdateProxyPayload):Promise<boolean> {
    return urClient
      .post('/update-proxy', payload)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
