import { formatTempOrSchedule, tOrScheduling } from '@smambu/lib.constants'
import { OR_SCHEDULING_ACTION } from 'store/actions'
type tOrSchedulingState = tOrScheduling[]

const initialState: tOrSchedulingState = []

export default function reducer (state = initialState, action: any): tOrSchedulingState {
  switch (action.type) {
    case OR_SCHEDULING_ACTION.SET_OR_SCHEDULES:
      return action.data
    case OR_SCHEDULING_ACTION.SET_EDITED_OR_SCHEDULES:
      return [
        ...state.filter(orScheduling => !action.data.some((newOrScheduling: tOrScheduling) =>
          orScheduling.timeStamp === newOrScheduling.timeStamp &&
          orScheduling.operatingRoomId === newOrScheduling.operatingRoomId)),
        ...action.data,
      ]
    case OR_SCHEDULING_ACTION.SET_OR_SCHEDULE_EDITED:
      const orSchedule = state
        .find(orScheduling => orScheduling.timeStamp === action.data.timeStamp &&
        orScheduling.operatingRoomId === action.data.operatingRoomId)

      if (orSchedule == null)
        return [
          ...state,
          formatTempOrSchedule(action.data.timeStamp, action.data.operatingRoomId),
        ]
      else
        return [
          ...state.filter(orScheduling => orScheduling._id !== orSchedule._id),
          {
            ...orSchedule,
            edited: true,
          },
        ]
    case OR_SCHEDULING_ACTION.ADD_ANESTHESIOLOGIST_TO_ROOM:
      const oldOrSchedule = state
        .find(orScheduling => orScheduling.timeStamp === action.data.timeStamp &&
        orScheduling.operatingRoomId === action.data.operatingRoomId)

      if (oldOrSchedule == null)
        return [
          ...state,
          formatTempOrSchedule(action.data.timeStamp,
            action.data.operatingRoomId,
            [action.data.anesthesiologistId]),
        ]
      else if (oldOrSchedule.anestIds.includes(action.data.anesthesiologistId))
        return state
      else
        return [
          ...state.filter(orScheduling => orScheduling._id !== oldOrSchedule._id),
          {
            ...oldOrSchedule,
            anestIds: [...oldOrSchedule.anestIds, action.data.anesthesiologistId],
            edited: true,
          },
        ]
    case OR_SCHEDULING_ACTION.REMOVE_ANESTHESIOLOGIST_FROM_ROOM:
      const roomOrSchedule = state
        .find(orScheduling => orScheduling._id === action.data.orScheduleId)

      return [
        ...state.filter(orSchedule => orSchedule._id !== roomOrSchedule!._id),
        {
          ...roomOrSchedule!,
          anestIds: roomOrSchedule!.anestIds
            .filter(anestId => anestId !== action.data.anesthesiologistId),
          edited: true,
        },
      ]
    default:
      return state
  }
}
