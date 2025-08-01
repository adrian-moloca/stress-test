import { OperatingRoom, tOrScheduling } from '../types'
import { getRandomUniqueId } from '../utils'

export const formatOperatingRoom = (operatingRoom: OperatingRoom) => {
  if (!operatingRoom) return {}
  const parsedOperatingRoom = {
    ...operatingRoom,
    exception: {
      ...operatingRoom.exception,
      startDate: operatingRoom?.exception?.startDate
        ? new Date(operatingRoom.exception.startDate)
        : null,
      endDate: operatingRoom?.exception?.endDate
        ? new Date(operatingRoom.exception.endDate)
        : null,
    },
  }
  return parsedOperatingRoom
}

const formatOrScheduleFromBE = (orSchedule: any): tOrScheduling => ({
  ...orSchedule,
  updatedAt: new Date(orSchedule.updatedAt),
  createdAt: new Date(orSchedule.createdAt),
})

export const formatOrSchedulingFromBE = (orScheduling: any): tOrScheduling[] =>
  orScheduling.map((orSchedule: any) => formatOrScheduleFromBE(orSchedule))

export const formatTempOrSchedule = (timeStamp: number,
  operatingRoomId: string,
  anestIds?: string[]): tOrScheduling => ({
  timeStamp,
  operatingRoomId,
  anestIds: anestIds || [],
  _id: `temp_${getRandomUniqueId()}`,
  edited: true,
})
