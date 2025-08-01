import { GetFilesInfoDto } from '@smambu/lib.constants'
import { BucketApi } from 'api/bucket.api'

export const useGetFilesinfo = () => {
  return async (data: GetFilesInfoDto) => {
    const files = await BucketApi.getFilesInfo(data)
    return files
  }
}

export const useDownloadFile = () => {
  return async (fileId: string) => {
    const blob = await BucketApi.downloadFile(fileId)
    return blob
  }
}

export const useDownloadCommonFile = () => {
  return async (fileId: string) => {
    const blob = await BucketApi.downloadCommonFile(fileId)
    return blob
  }
}

export const useSuperAdminDownloadFile = () => {
  return async (fileId: string) => {
    const blob = await BucketApi.superAdminDownloadFile(fileId)
    return blob
  }
}
