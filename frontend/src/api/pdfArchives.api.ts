import { ArchiveAllEligiblesDTO, IGetPDFArchivesDTO, IRequestPDFArchiveGenerationDTO } from '@smambu/lib.constants'
import { billingClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'

export class PdfArchiveApi {
  static async requestArchiveGeneration (query: IRequestPDFArchiveGenerationDTO) {
    return billingClient
      .post('/pdfarchives/generate-archive', query)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getPDFArchives (query: IGetPDFArchivesDTO) {
    return billingClient
      .post('/pdfarchives/getPdfArchives', query)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async archiveAllEligibles (data: ArchiveAllEligiblesDTO) {
    return billingClient
      .post('/pdfarchives/generate-all-eligibles-archive', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
