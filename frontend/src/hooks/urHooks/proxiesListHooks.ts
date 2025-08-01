import { tProxy, tProxyListRequest, tProxyPaginatedResult, tUpdateProxyPayload } from '@smambu/lib.constants'
import { ProxiesApi } from 'api/ur/proxies.api'
import useCall from 'hooks/useCall'

export const useGetProxiesList = () => {
  const call = useCall()

  return (page:number, pageSize: number, domainId: string): Promise<tProxyPaginatedResult> =>
    call(async function useGetProxiesList () {
      const data:tProxyListRequest = { page, pageSize, domainId }

      const response = await ProxiesApi.getProxiesList(data)

      return response
    })
}

export const useGetProxyByContextKey = () => {
  const call = useCall()

  return (domainId: string, contextKey:string): Promise<tProxy> =>
    call(async function useGetProxyByContextKey () {
      const response = await ProxiesApi.getProxiesByContextKey(domainId, contextKey)

      return response
    })
}

export const useUpdateProxy = () => {
  const call = useCall()

  return (updatePayload: tUpdateProxyPayload): Promise<tProxy> =>
    call(async function useUpdateProxy () {
      const response = await ProxiesApi.updateProxy(updatePayload)

      return response
    })
}
