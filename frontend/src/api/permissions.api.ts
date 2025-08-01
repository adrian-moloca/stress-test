import { getReadableErrorMessage } from 'utilities/misc'
import { roleClient } from './apiClient'

export class PermissionsApi {
  static async getPermissions () {
    return roleClient
      .get('/capabilities')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
