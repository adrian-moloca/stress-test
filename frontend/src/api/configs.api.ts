/* eslint-disable no-undef */
// this is not referenced anywhere. Delete it?
import { ICreateRoleRequest } from '@smambu/lib.constants'
import { getReadableErrorMessage } from 'utilities/misc'

export class ConfigsApi {
  static async saveConfigs (data: ICreateRoleRequest) {
    return configClient
      .post('/roles', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
