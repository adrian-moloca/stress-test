import { getReadableErrorMessage } from 'utilities/misc'
import { tenantsClient } from './apiClient'
import { ExportTenantDTO, ResetTenantDTO } from '@smambu/lib.constants'

export class TenantsApi {
  static async reset (data: ResetTenantDTO) {
    return tenantsClient
      .post('/tenants/reset', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async export (data: ExportTenantDTO) {
    return tenantsClient
      .post('/tenants/export', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
