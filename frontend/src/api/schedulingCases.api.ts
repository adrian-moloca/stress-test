import { schedulingCasesClient } from './apiClient'
import {
  lockWeekDto,
  QueryCasesDto,
  scheduleCaseDTO,
  associatePatientDto,
  updateAnesthesiologistsDto,
  updateMultipleCasesAnesthesiologistsDto,
  CaseFormDTO,
  deleteCaseFilesDto,
  lockWeekResponseDto,
  UpdateCaseDTO,
  UpdateCaseResponse,
  CloseCaseDTO,
  calendarNotesTypes,
  tExplorerDataDto,
} from '@smambu/lib.constants'
import { trlb } from 'utilities'
import { getReadableErrorMessage } from 'utilities/misc'
export class SchedulingCasesApi {
  static async createCase (data: CaseFormDTO) {
    return schedulingCasesClient
      .post('/cases', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async closeCase (caseId: string) {
    const data: CloseCaseDTO = { caseId }

    return schedulingCasesClient
      .post('/cases/closeCase', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)

        return Promise.reject(new Error(message))
      })
  }

  static async reOpenCase (caseId: string) {
    const data: CloseCaseDTO = { caseId }

    return schedulingCasesClient
      .post('/cases/reOpenCase', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)

        return Promise.reject(new Error(message))
      })
  }

  static async getCases (data: QueryCasesDto) {
    return schedulingCasesClient
      .get('/cases', {
        params: {
          ...data,
          datePattern: trlb('dateTime_date_string'),
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getCasesCSV (data: QueryCasesDto) {
    return schedulingCasesClient
      .get('/cases/getCasesCSV', {
        params: {
          ...data,
          datePattern: trlb('dateTime_date_string'),
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editCase (caseId: string, data: UpdateCaseDTO): Promise<UpdateCaseResponse> {
    return schedulingCasesClient
      .put(`/cases/${caseId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async scheduleCase (caseId: string, data: scheduleCaseDTO) {
    return schedulingCasesClient
      .post(`/scheduling/${caseId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async lockWeek (data: lockWeekDto): Promise<lockWeekResponseDto> {
    return schedulingCasesClient
      .post('/scheduling/lockWeek', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getScheduledWeek (date: string) {
    return schedulingCasesClient
      .get(`/scheduling/${date}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async resetBackup (date: string) {
    return schedulingCasesClient
      .delete(`/scheduling/resetBackup/${date}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async associatePatient (data: associatePatientDto) {
    return schedulingCasesClient
      .post('/cases/associatePatient', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async uploadCheckinDocuments (caseId: string, data: FormData) {
    return schedulingCasesClient
      .put(`/cases/uploadCheckinDocuments/${caseId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getCaseById (caseId: string) {
    return schedulingCasesClient
      .get(`/cases/${caseId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getContractLastActiveCase (contractId: string) {
    return schedulingCasesClient
      .get(`/cases/contractLastActiveCase/${contractId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getContractLastCase (contractId: string) {
    return schedulingCasesClient
      .get(`/cases/contractLastCase/${contractId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async uploadCaseDocuments (caseId: string, data: FormData) {
    return schedulingCasesClient
      .put(`/cases/uploadCaseDocuments/${caseId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async uploadCheckoutDocuments (caseId: string, data: FormData) {
    return schedulingCasesClient
      .put(`/cases/uploadCheckoutDocuments/${caseId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async uploadIntraOpDocuments (caseId: string, data: FormData) {
    return schedulingCasesClient
      .put(`/cases/uploadIntraOpDocuments/${caseId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async updateAnesthesiologists (caseId: string, data: updateAnesthesiologistsDto) {
    return schedulingCasesClient
      .put(`/cases/updateAnesthesiologists/${caseId}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  // eslint-disable-next-line max-len
  static async updateMultipleCasesAnesthesiologists (data: updateMultipleCasesAnesthesiologistsDto) {
    return schedulingCasesClient
      .put('/cases/updateMultipleCasesAnesthesiologists', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editCaseDuration (caseId: string, duration: number) {
    return schedulingCasesClient
      .put(`/cases/editCaseDuration/${caseId}`, { duration })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editCaseCalendarNotes (caseId: string,
    calendarNotes: string,
    type: calendarNotesTypes) {
    return schedulingCasesClient
      .put(`/cases/editCaseCalendarNotes/${caseId}`, { calendarNotes, type })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async approveChangeNotified (caseId: string) {
    return schedulingCasesClient
      .put(`/cases/approveChangeNotified/${caseId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getLastCases (query: { limit?: number }) {
    return schedulingCasesClient
      .get('/cases/getLastCases', { params: query })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async deleteCaseFiles (data: deleteCaseFilesDto) {
    return schedulingCasesClient
      .delete('/cases/caseFiles', {
        data,
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async reviewCase (caseId: string) {
    return schedulingCasesClient
      .post(`/cases/reviewCase/${caseId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getOpstandardUtilization (opstandardId: string) {
    return schedulingCasesClient
      .get(`/cases/getOpstandardUtilization/${opstandardId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getExplorerData (data: tExplorerDataDto) {
    return schedulingCasesClient
      .get('/cases/getExplorerData', {
        params: {
          ...data,
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getCaseMaterialsPrices (caseId: string) {
    return schedulingCasesClient
      .get(`/cases/${caseId}/caseMaterialsPrices`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
