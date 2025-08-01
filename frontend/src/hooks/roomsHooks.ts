import { RoomsApi } from 'api/rooms.api'
import useCall from './useCall'
import { OperatingRoom, ToastType, formatOperatingRoom, getDayTimestamp, formatOrSchedulingFromBE } from '@smambu/lib.constants'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION, OPERATING_ROOMS_ACTION, OR_SCHEDULING_ACTION } from 'store/actions'
import { trlb } from 'utilities/translator/translator'
import { useAppSelector } from 'store'

const timeZone = import.meta.env.VITE_TIME_ZONE

export const useEditRoom = () => {
  const call = useCall()
  const dispatch = useDispatch()
  return ({ roomId, roomValues }: { roomId: string; roomValues: OperatingRoom }) =>
    call(async function updateRoom () {
      const room = await RoomsApi.editRoom(roomId, roomValues)
      dispatch({
        type: OPERATING_ROOMS_ACTION.SET_OPERATING_ROOM,
        data: room,
      })
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: trlb('toastSuccess_room_edited', { id: room.name }),
          type: ToastType.success,
        },
      })
    })
}

export const useSaveRoom = () => {
  const call = useCall()
  const dispatch = useDispatch()
  return ({ roomValues }: { roomValues: OperatingRoom }) =>
    call(async function saveNewRoom () {
      const room = await RoomsApi.saveRoom(roomValues)
      dispatch({
        type: OPERATING_ROOMS_ACTION.SET_OPERATING_ROOM,
        data: room,
      })
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: trlb('toastSuccess_new_room_created', {
            id: room.operatingRoomId,
          }),
          type: ToastType.success,
        },
      })
    })
}

export const useDeleteRoom = () => {
  const call = useCall()
  const dispatch = useDispatch()
  return ({ roomId }: { roomId: string }) =>
    call(async function deleteRoom () {
      await RoomsApi.deleteRoom(roomId)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: trlb('toastSuccess_room_deleted', { id: roomId }),
          type: ToastType.success,
        },
      })
    })
}

export const useGetOperatingRooms = () => {
  const dispatch = useDispatch()
  const call = useCall()

  return () =>
    call(async function getOperatingRooms () {
      const operatingRooms = await RoomsApi.getAllRooms()
      dispatch({
        type: OPERATING_ROOMS_ACTION.SET_OPERATING_ROOMS,
        data: operatingRooms
          .reduce((acc, curr) => ({ ...acc, [curr.operatingRoomId]: formatOperatingRoom(curr) }),
            {}),
      })
    })
}

export const useGetIsOrUsed = () => {
  const call = useCall()
  return (id: string) =>
    call(async function getIsOrUsed () {
      if (!id) return false
      return await RoomsApi.isOrUsed(id)
    })
}

export const useGetOrScheduling = () => {
  const call = useCall()
  const dispatch = useDispatch()

  return (date: Date) =>
    call(async function getOrScheduling () {
      const dayTimeStamp = getDayTimestamp(date, timeZone)

      const res = await RoomsApi.getOrScheduling(dayTimeStamp)
      dispatch({
        type: OR_SCHEDULING_ACTION.SET_OR_SCHEDULES,
        data: formatOrSchedulingFromBE(res),
      })
    })
}

export const useEditOrScheduling = () => {
  const orScheduling = useAppSelector(state => state.orScheduling)
  const call = useCall()
  const dispatch = useDispatch()

  return () =>
    call(async function editOrScheduling () {
      const payload = orScheduling
        .filter(orSchedule => orSchedule.edited)
        .map(orSchedule => ({
          _id: orSchedule._id,
          operatingRoomId: orSchedule.operatingRoomId,
          timeStamp: orSchedule.timeStamp,
          anestIds: orSchedule.anestIds,
        }))

      const res = await RoomsApi.editOrScheduling(payload)

      dispatch({
        type: OR_SCHEDULING_ACTION.SET_EDITED_OR_SCHEDULES,
        data: formatOrSchedulingFromBE(res),
      })
    })
}
