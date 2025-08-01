import { getReadableErrorMessage } from 'utilities/misc'
import { tURConfigsData, tURConfigsDocuments, VERSIONS_NAMES } from '@smambu/lib.constants'
import { urClient } from 'api/apiClient'

export class UrConfigApi {
  static async getURConfigsLastUpdate () {
    return urClient
      .get('/uRConfigsLastUpdate')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getURConfigs (tenantId: string, version?: string): Promise<tURConfigsDocuments> {
    const versionProvided = version != null && version !== ''
    const versionToGet = versionProvided ? version : VERSIONS_NAMES.LATEST

    return urClient
      .get(`/configuration/${versionToGet}?tenantId=${tenantId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async setURConfigs (tenantId: string, data: tURConfigsData) {
    return urClient
      .post(`/configuration/?tenantId=${tenantId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getDynamicData () {
    return urClient
      .get('/getDynamicData')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
