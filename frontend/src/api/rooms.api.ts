import { OperatingRoom, editOrSchedulingDto } from '@smambu/lib.constants'
import { operatingRoomClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'
export class RoomsApi {
  static path: string = '/or-management'
  static orSchedulingPath: string = '/or-scheduling'

  static async getAllRooms (): Promise<OperatingRoom[]> {
    return operatingRoomClient
      .get(`${this.path}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async editRoom (id: string, data: OperatingRoom) {
    return operatingRoomClient
      .put(`${this.path}/${id}`, data)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }

  static async saveRoom (data: OperatingRoom) {
    return operatingRoomClient
      .post(`${this.path}`, data)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }

  static async deleteRoom (id: string) {
    return operatingRoomClient
      .delete(`${this.path}/${id}`)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }

  static async isOrUsed (id: string): Promise<Boolean> {
    if (!id) return Promise.reject(new Error('Missing id'))
    return operatingRoomClient
      .get(`${this.path}/isOrUsed/${id}`)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }

  static async getOrScheduling (timeStamp: number) {
    return operatingRoomClient
      .get(`${this.orSchedulingPath}/${timeStamp}`)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }

  static async editOrScheduling (data: editOrSchedulingDto) {
    return operatingRoomClient
      .post(`${this.orSchedulingPath}`, data)
      .then(res => res.data)
      .catch(err => Promise.reject(new Error(err?.response?.data?.message ?? err.message ?? err)))
  }
}
