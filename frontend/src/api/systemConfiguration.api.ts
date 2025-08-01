import { systemConfigurationSections } from '@smambu/lib.constants'
import { systemConfigurationClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'

export class SystemConfigurationApi {
  static async getSystemConfiguration () {
    return systemConfigurationClient
      .get('/')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getSystemConfigurationSection ({
    section,
    superAdmin,
    tenantId,
  }: {
    section: systemConfigurationSections
    superAdmin?: boolean
    tenantId?: string
  }) {
    return systemConfigurationClient
      .get(`/${
        superAdmin ? 'superAdmin/' : ''
      }${
        section
      }${
        tenantId ? `?tenantId=${tenantId}` : ''
      }`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editSystemConfigurationSection ({
    section,
    data,
    superAdmin,
    tenantId,
  }: {
    section: systemConfigurationSections
    data: any
    superAdmin?: boolean
    tenantId?: string
  }) {
    return systemConfigurationClient
      .post(`/${
        superAdmin ? 'superAdmin/' : ''
      }${
        section
      }${
        tenantId ? `?tenantId=${tenantId}` : ''
      }`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
