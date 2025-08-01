import { OperatingRoomStatus } from '../enums'

export interface OperatingRoom {
  tenantId: string
  operatingRoomId: string
  // this id is chosen by the user
  customRoomId: string
  name: string
  status: OperatingRoomStatus
  exception: OperatingRoomException | null
  notes: string
}

export interface OperatingRoomException {
  startDate: Date
  endDate: Date
  repeatedEvery: (0 | 1 | 2 | 3 | 4 | 5 | 6)[]
}

export type tOrScheduling = {
  _id: string
  tenantId?: string
  operatingRoomId: string
  timeStamp: number
  anestIds: string[]
  edited?: boolean
  updatedAt?: Date
  createdAt?: Date
}

export type tOrScheduleDispatchData = Omit<tOrScheduling, '_id' | 'tenantId'>

export enum AnestChipSources {
  OR = 'OR',
  SIDEBAR = 'SIDEBAR',
  CASE = 'CASE',
}
