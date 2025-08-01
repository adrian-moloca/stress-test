import {
  PrescriptionsPcMaterialsRequestDTO,
  GetSammelCheckpointPreviewDTO,
  PrescriptionsFullTextQueryDto,
  IGeneratePrescriptionsDTO,
} from '@smambu/lib.constants'
import { billingClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'
import { trlb } from 'utilities'

export class BillingApi {
  static async getCheckpointPreview (data: GetSammelCheckpointPreviewDTO) {
    return billingClient
      .post('/pc-materials/checkpointPreview', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getPrescriptionsPcMaterials (data: PrescriptionsPcMaterialsRequestDTO) {
    return billingClient
      .get('/pc-materials/prescriptions-pc-materials', {
        params: {
          ...data,
          datePattern: trlb('dateTime_date_string')
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getPcMaterialsByCasesIds (casesIds: string[]) {
    return billingClient
      .get('/pc-materials', {
        params: {
          casesIds,
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getPrescriptionsCSV (query: PrescriptionsFullTextQueryDto) {
    return billingClient
      .post('/prescriptions/get-prescriptions-csv', query)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async fetchPrescriptions (query: PrescriptionsFullTextQueryDto) {
    return billingClient
      .post('/prescriptions/full-text', query)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async generatePrescriptions (query: IGeneratePrescriptionsDTO) {
    return billingClient
      .post('/prescriptions/generate', query)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async setPrescriptionPrescribed (prescriptionId: string) {
    return billingClient
      .post(`/prescriptions/setPrescribed/${prescriptionId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
