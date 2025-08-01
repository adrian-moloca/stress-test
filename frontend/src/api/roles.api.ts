import { ICreateRoleRequest, IDeleteRoleRequest, IEditRoleRequest } from '@smambu/lib.constants'
import { roleClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'

export class RolesApi {
  static async findAll () {
    return roleClient
      .get('/roles')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async createRole (data: ICreateRoleRequest) {
    return roleClient
      .post('/roles', data)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }

  static async deleteOne (data: IDeleteRoleRequest) {
    return roleClient
      .delete(`/roles/${data.id}`)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }

  static async editRole (id: string, data: IEditRoleRequest) {
    return roleClient
      .patch(`/roles/${id}`, data)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }
}
