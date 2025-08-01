import { getReadableErrorMessage } from 'utilities/misc'
import { authClient } from './apiClient'
import { TranslatorLanguage } from '@smambu/lib.constants'

export class AuthApi {
  static async login (data: { email: string; password: string }) {
    return authClient
      .post('/auth/login', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async loginToTenant (data: { email: string; tenantId: string }, token: string) {
    return authClient
      .post('/auth/loginToTenant', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async logout () {
    return authClient
      .post('/auth/logout')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async resetPassword (data: any) {
    return authClient
      .post('/auth/reset-password', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async forgotPassword (data: any) {
    return authClient
      .post('/auth/forgot-password', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async verifyEmail (token: string) {
    return authClient
      .post(`/auth/verify-email?token=${token}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async resendVerificationEmail ({ email }: { email: string },
    language: TranslatorLanguage) {
    return authClient
      .post('/auth/resend-verification-email', { email, language })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
