import { getReadableErrorMessage } from 'utilities/misc'
import { userClient } from './apiClient'
import { GetCurrentUserResponseDto, ICreateUserRequest, IGetUsersQuery } from '@smambu/lib.constants'

export class UsersApi {
  static async getCredentialData (email: string) {
    return userClient
      .get(`/credentials/${email}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async checkEmailAlreadyUsed (email: string) {
    return userClient
      .get(`/checkEmailAlreadyUsed/${email}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getUsers (params?: IGetUsersQuery) {
    return userClient
      .get('/users', { params })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getDoctors () {
    return userClient
      .get('/doctors')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getAnesthesiologists () {
    return userClient
      .get('/anesthesiologists')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getCurrentUser (): Promise<GetCurrentUserResponseDto> {
    return userClient
      .get('/users/me')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getUserDetail (id: string) {
    return userClient
      .get(`/users/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async createUser (data: ICreateUserRequest) {
    return userClient
      .post('/users', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editUser (id: string, data: ICreateUserRequest) {
    return userClient
      .put(`/users/${id}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async requestUserResetPassword (id: string) {
    return userClient
      .post(`/users/${id}/request-reset-password`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
