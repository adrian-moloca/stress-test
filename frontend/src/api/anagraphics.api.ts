import {
  IAnagraphicsGetRequest,
  IAnagraphicsVersionDeleteRequest,
  IAnagraphicsVersionPostRequest,
  dateString,
} from '@smambu/lib.constants'
import { format } from 'date-fns'
import { anagraphicsClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'

export class AnagraphicsApi {
  static async getVersion ({
    anagraphicType,
    subType,
    versionId,
    updatedAt
  }: IAnagraphicsGetRequest) {
    return anagraphicsClient
      .get(`/${anagraphicType}/${subType ?? anagraphicType}/${versionId}`, { params: { updatedAt } })
      .then(res => ({
        data: res.data,
        status: res.data.status,
      }))
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getActiveVersion ({
    anagraphicType,
    subType,
    date,
    versionId,
    updatedAt
  }: IAnagraphicsGetRequest) {
    const url = `/activeVersion/${anagraphicType}/${subType ?? anagraphicType}/${format(date ?? new Date(), dateString)}`

    return anagraphicsClient
      .get(url, {
        params: { updatedAt, versionId },
      })
      .then(res => ({
        data: res.data,
        status: res.data.status,
      }))
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editVersion ({ anagraphicType, subType, version }: IAnagraphicsVersionPostRequest) {
    const url = `/${anagraphicType}/${subType ?? anagraphicType}`

    return anagraphicsClient
      .post(url, version)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async deleteVersion ({
    anagraphicType,
    subType,
    versionId
  }: IAnagraphicsVersionDeleteRequest) {
    const url = `/${anagraphicType}/${subType ?? anagraphicType}/${versionId}`

    return anagraphicsClient
      .delete(url)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
