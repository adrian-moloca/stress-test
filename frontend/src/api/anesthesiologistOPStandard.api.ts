/* eslint-disable prefer-promise-reject-errors */
import {
  AnesthesiologistOpStandard,
  AxiosCancellationError,
  CreateAnesthesiologistOpStandardDto,
  Identifier,
  QueryAnesthesiologistOpStandardDto,
  UpdateAnesthesiologistOpStandardDto,
} from '@smambu/lib.constants'
import { contractClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'

export class AnesthesiologistOPStandardApi {
  static path: string = '/anesthesiologist-op-standard'

  static async getAnesthesiologistOPStandards (
    queries?: QueryAnesthesiologistOpStandardDto,
    abortController?: AbortController,
  ) {
    try {
      const res = await contractClient.get(`${this.path}`, {
        params: queries,
        signal: abortController?.signal,
      })
      return res.data
    } catch (err) {
      if (abortController?.signal.aborted) throw new AxiosCancellationError()
      else throw err
    }
  }

  static getAnesthesiologistOPStandardById (id: string) {
    return contractClient
      .get(`${this.path}/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static getNearAnesthesiologistOPStandardVersions (id: string) {
    return contractClient
      .get(`${this.path}/near-versions/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static createAnesthesiologistOPStandardVersion (item: CreateAnesthesiologistOpStandardDto,
    id: Identifier) {
    return contractClient
      .post(`${this.path}/new-version/${id}`, item)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static createAnesthesiologistOPStandard (item: CreateAnesthesiologistOpStandardDto) {
    return contractClient
      .post(`${this.path}`, item)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static deleteAnesthesiologistOPStandard (id: AnesthesiologistOpStandard['anesthesiologistOpStandardId']) {
    return contractClient
      .delete(`${this.path}/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static updateAnesthesiologistOPStandard (
    id: AnesthesiologistOpStandard['anesthesiologistOpStandardId'],
    item: UpdateAnesthesiologistOpStandardDto,
  ) {
    return contractClient
      .put(`${this.path}/${id}`, item)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static getNames () {
    return contractClient
      .get(`${this.path}/getNames`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
