import { GetPatientsDto, SerializedPatient } from '@smambu/lib.constants'
import { patientsClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'
import { trlb } from 'utilities'
export class PatientsApi {
  static async createPatient (data: SerializedPatient) {
    return patientsClient
      .post('/patients', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getFilteredPatients (data: GetPatientsDto) {
    return patientsClient
      .post('/patients/getFilteredPatients', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async fetchPatients (data: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: string | null) {
    return patientsClient
      .get('/patients/full-text', {
        params: {
          query: data,
          page: page ?? 0,
          limit: limit ?? 7,
          sortBy,
          sortOrder,
          datePattern: trlb('dateTime_date_string'),
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async fetchPatient (id: string) {
    return patientsClient
      .get(`/patients/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async updatePatient (patient: SerializedPatient) {
    return patientsClient
      .put(`/patients/${patient.patientId}`, patient)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
