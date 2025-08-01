import { GetFilesInfoDto } from '@smambu/lib.constants'
import { bucketClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'

export class BucketApi {
  static async getFilesInfo (data: GetFilesInfoDto) {
    return bucketClient
      .post('/files/getFilesInfo', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async downloadFile (fileId: string) {
    return bucketClient
      .get('/files', {
        params: {
          id: fileId,
        },
        responseType: 'blob',
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async downloadCommonFile (fileId: string) {
    return bucketClient
      .get('/files/commons', {
        params: {
          id: fileId,
        },
        responseType: 'blob',
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async superAdminUploadFile (file: File, fileName: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', fileName)
    return bucketClient
      .post('/files/superAdmin', formData)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async superAdminDownloadFile (fileId: string) {
    return bucketClient
      .get('/files/superAdmin', {
        params: {
          id: fileId,
        },
        responseType: 'blob',
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
