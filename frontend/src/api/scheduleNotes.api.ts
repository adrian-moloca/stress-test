import { schedulingCasesClient } from './apiClient'
import {
  tCreateScheduleNoteDto,
  tEditScheduleNoteDto,
  tGetScheduleNotesDto,
} from '@smambu/lib.constants'

import { getReadableErrorMessage } from 'utilities/misc'
export class ScheduleNotesApi {
  static async createScheduleNote (data: tCreateScheduleNoteDto) {
    return schedulingCasesClient
      .post('/scheduleNotes', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editScheduleNote (data: tEditScheduleNoteDto) {
    return schedulingCasesClient
      .patch('/scheduleNotes', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getScheduleNotes (data: tGetScheduleNotesDto) {
    return schedulingCasesClient
      .get('/scheduleNotes', {
        params: {
          page: data.page,
          limit: data.limit,
          timeStep: data.timeStep,
          timestamp: data.timestamp
        }
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
