import {
  CaseStatus,
  OperatingRoom,
  OperatingRoomStatus,
  permissionRequests,
  Contract,
  OperatingRoomException,
  dateString,
  isPendingCase,
  ILimitedCase,
  getLockedWeekTimestamp,
  calendarPollingInterval,
  statusesToExcludeWithConfirmedBooking,
  getCaseNewStatus,
} from '@smambu/lib.constants'
import { trlb } from 'utilities'
import {
  isAfter,
  isBefore,
  getDay,
  isSameDay,
  isValid,
  startOfWeek,
  getUnixTime,
  add,
  endOfWeek,
  format,
} from 'date-fns'
import { useDispatch } from 'react-redux'
import useCall from '../useCall'
import {
  SCHEDULING_ACTION,
  LIMITED_CASES_ACTION,
  GLOBAL_ACTION,
  ANESTHESIOLOGISTS_SCHEDULE_ACTION,
  OR_SCHEDULING_ACTION,
} from 'store/actions'
import { useAppSelector } from 'store'
import { useNavigate, useParams } from 'react-router-dom'
import React, { useCallback, useEffect } from 'react'
import { useGetCheckPermission } from 'hooks/userPermission'
import {
  useGetDayBookings,
  useGetMonthBookings,
  useGetScheduledWeek,
  useGetWeekBookings,
  useResetBackup,
  useScheduleCase,
  useUpdateMultipleCasesAnesthesiologists,
} from 'hooks/caseshooks'
import { useLockWeekApi } from '../caseshooks'
import { formatCaseResponse } from '@smambu/lib.constants/src/formatters/case'

const timeZone = import.meta.env.VITE_TIME_ZONE

export const useSetLimitedCase = () => {
  const dispatch = useDispatch()
  const call = useCall()

  return (data: ILimitedCase) =>
    call(function setCase () {
      dispatch({
        type: LIMITED_CASES_ACTION.SET_CASE,
        data,
      })
    })
}

// the status is linked to the interval (here called exception). that said,
// the formula changes as follow:
// if the status is available, every date outside the interval the room is unavailable
// if the status is not available, every date outside the interval the room is available

const available = (orException: OperatingRoomException, date: Date) => {
  const dateRangeCheck = !isAfter(orException.startDate, date) &&
   !isBefore(orException.endDate, date)

  if (!dateRangeCheck) return false

  return orException.repeatedEvery?.length > 0
    ? orException.repeatedEvery.includes(getDay(date))
    : true
}

export const useIsOperatingRoomAvailable = () => {
  const operatingRooms = useAppSelector(state => state.operatingRooms)

  return ({ operatingRoomId, date }: { operatingRoomId?: string; date: Date }): boolean => {
    const or: OperatingRoom | undefined = operatingRooms[operatingRoomId!]

    if (!or) return false

    if (!or.exception) return or.status === OperatingRoomStatus.AVAILABLE

    const isAvailable = available(or.exception, date)

    return or.status === OperatingRoomStatus.AVAILABLE ? isAvailable : !isAvailable
  }
}

export const useGetDragginCaseContractSurgerySlotsByDay = () => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const contracts = Object.values(useAppSelector(state => state.contracts))

  return ({ draggingCaseId, day }: { draggingCaseId?: string; day: Date }) => {
    if (!draggingCaseId || !isValid(day)) return []

    const c = limitedCases[draggingCaseId]

    const contractId = c?.bookingSection?.contractId

    const contract: Contract | undefined = contracts.find(item => item.contractId === contractId)
    return contract?.details?.surgerySlots?.filter(slot => isSameDay(new Date(slot.from), day))
  }
}

export const usePutRequestOnHold = () => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const reschedule = useRescheduleCase()

  return (caseId: string) => {
    const c = limitedCases[caseId]
    if (!c) return
    reschedule({
      caseId,
      status: CaseStatus.ON_HOLD,
    })
  }
}

export const useRestoreBoookingRequest = () => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const reschedule = useRescheduleCase()

  return (caseId: string) => {
    const c = limitedCases[caseId]
    if (c?.status === CaseStatus.ON_HOLD)
      reschedule({
        caseId,
        status: CaseStatus.LOCKED,
      })
  }
}

export const useRequestChangeToBooking = () => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const reschedule = useRescheduleCase()

  return (caseId: string) => {
    const c = limitedCases[caseId]
    if (!c) return
    reschedule({
      caseId,
      status: CaseStatus.CHANGE_REQUESTED,
    })
  }
}

export const useRescheduleCase = () => {
  const checkPermission = useGetCheckPermission()
  const canScheduleDayBookings = checkPermission(permissionRequests.canScheduleDayBookings)
  const canSchedule = checkPermission(permissionRequests.canSchedule)
  const canScheduleRooms = checkPermission(permissionRequests.canScheduleRooms)
  const limitedCases = useAppSelector(state => state.limitedCases)
  const setLimitedCase = useSetLimitedCase()
  const dispatch = useDispatch()
  const schedule = useScheduleCase()
  const { lockedWeeks, caseBackup } = useAppSelector(state => state.scheduling)

  return async ({
    caseId,
    newDate,
    newOrId,
    status,
    withoutBackup,
    confirmationNote,
  }: {
    caseId: string
    newDate?: Date
    newOrId?: string
    status?: CaseStatus
    withoutBackup?: boolean
    confirmationNote?: string
  }) => {
    const c = limitedCases[caseId]
    if (!c) return

    const getNewStatus = (c: ILimitedCase, newDate?: Date, status?: CaseStatus) => {
      if (status != null) return status

      return getCaseNewStatus(
        c,
        { canScheduleDayBookings, canSchedule, canScheduleRooms },
        newDate,
      )
    }

    const newStatus = getNewStatus(c, newDate, status)

    const lockedWeekTimestamp = getLockedWeekTimestamp(c.bookingSection.date, timeZone)

    try {
      const updatedCase = await schedule(caseId, {
        caseId,
        newOrId,
        newDate,
        newStatus,
        withoutBackup,
        confirmationNote,
      })
      const formattedResponse = formatCaseResponse(updatedCase)
      setLimitedCase(formattedResponse)
      if (lockedWeeks[lockedWeekTimestamp] &&
         !caseBackup?.[lockedWeekTimestamp]?.[caseId] &&
         !withoutBackup)
        dispatch({
          type: SCHEDULING_ACTION.SET_CASE_BACKUP,
          payload: {
            caseId,
            date: c.bookingSection.date,
            orId: c.operatingRoomId,
            status: c.status,
          },
        })
    } catch (e) {
      console.error(e)
    }
  }
}

export const useAssignAnesthesiologistToCase = () => {
  const checkPermission = useGetCheckPermission()
  // eslint-disable-next-line max-len
  const canEditAnesthesiologistsScheduling = checkPermission(permissionRequests.canEditAnesthesiologistsScheduling)
  const limitedCases = useAppSelector(state => state.limitedCases)
  const setLimitedCase = useSetLimitedCase()
  const dispatch = useDispatch()

  return async ({
    caseId,
    anesthesiologistId,
    timeStamp
  }:
  { caseId: string;
    anesthesiologistId: string,
    timeStamp: number }) => {
    const c = limitedCases[caseId]
    if (!c) return
    if (!canEditAnesthesiologistsScheduling) return
    const anesthesiologistsId = [...c.anesthesiologistsId]
    if (!anesthesiologistsId.includes(anesthesiologistId)) {
      anesthesiologistsId.push(anesthesiologistId)
      dispatch({
        type: ANESTHESIOLOGISTS_SCHEDULE_ACTION.SET_ANESTHESIOLOGISTS_SCHEDULE,
        payload: {
          [caseId]: anesthesiologistsId,
        },
      })
      dispatch({
        type: OR_SCHEDULING_ACTION.SET_OR_SCHEDULE_EDITED,
        data: {
          timeStamp,
          operatingRoomId: c.operatingRoomId,
        },
      })
      setLimitedCase({
        ...c,
        anesthesiologistsId,
      })
    }
  }
}

export const useRemoveAnesthesiologistFromCase = () => {
  const cases = useAppSelector(state => state.limitedCases)
  const setLimitedCase = useSetLimitedCase()
  const dispatch = useDispatch()

  return async ({
    caseId, anesthesiologistId, timeStamp,
  }: {
    caseId: string; anesthesiologistId: string, timeStamp: number
  }) => {
    const c = cases[caseId]
    if (!c) return
    const anesthesiologistsId = [...c.anesthesiologistsId]
    const index = anesthesiologistsId.indexOf(anesthesiologistId)
    if (index > -1) {
      anesthesiologistsId.splice(index, 1)
      dispatch({
        type: ANESTHESIOLOGISTS_SCHEDULE_ACTION.SET_ANESTHESIOLOGISTS_SCHEDULE,
        payload: {
          [c.caseId]: anesthesiologistsId,
        },
      })
      dispatch({
        type: OR_SCHEDULING_ACTION.SET_OR_SCHEDULE_EDITED,
        data: {
          timeStamp,
          operatingRoomId: c.operatingRoomId,
        },
      })
      setLimitedCase({
        ...c,
        anesthesiologistsId,
      })
    }
  }
}

export const useAssignAnesthesiologistToRoom = () => {
  const checkPermission = useGetCheckPermission()
  const canEditAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canEditAnesthesiologistsScheduling)
  const limitedCases = useAppSelector(state => state.limitedCases)
  const setLimitedCase = useSetLimitedCase()
  const dispatch = useDispatch()

  return async ({
    operatingRoomId, anesthesiologistId, date, timeStamp
  }: {
    operatingRoomId: string
    anesthesiologistId: string
    date: Date
    timeStamp: number
  }) => {
    if (!canEditAnesthesiologistsScheduling) return

    const dayRoomCases = Object.values(limitedCases).filter(
      c => c.operatingRoomId === operatingRoomId && isSameDay(c.bookingSection.date, date),
    )

    dayRoomCases.forEach(c => {
      const anesthesiologistsId = [...c.anesthesiologistsId]
      if (!anesthesiologistsId.includes(anesthesiologistId)) {
        anesthesiologistsId.push(anesthesiologistId)
        dispatch({
          type: ANESTHESIOLOGISTS_SCHEDULE_ACTION.SET_ANESTHESIOLOGISTS_SCHEDULE,
          payload: {
            [c.caseId]: anesthesiologistsId,
          },
        })
        setLimitedCase({
          ...c,
          anesthesiologistsId,
        })
      }
    })

    dispatch({
      type: OR_SCHEDULING_ACTION.ADD_ANESTHESIOLOGIST_TO_ROOM,
      data: {
        timeStamp,
        operatingRoomId,
        anesthesiologistId
      }
    })
  }
}

export const useRemoveAnesthesiologistFromRoom = () => {
  const orScheduling = useAppSelector(state => state.orScheduling)
  const limitedCases = useAppSelector(state => state.limitedCases)
  const setLimitedCase = useSetLimitedCase()
  const dispatch = useDispatch()

  return async ({
    anesthesiologistId, date, orScheduleId
  }: { anesthesiologistId: string; date: Date; orScheduleId: string
  }) => {
    const orSchedule = orScheduling.find(o => o._id === orScheduleId)

    const dayRoomCases = Object.values(limitedCases).filter(
      caseItem => caseItem.operatingRoomId === orSchedule!.operatingRoomId &&
       isSameDay(caseItem.bookingSection.date, date),
    )

    dayRoomCases.forEach(caseItem => {
      const anesthesiologistsId = [...caseItem.anesthesiologistsId]
      const index = anesthesiologistsId.indexOf(anesthesiologistId)
      if (index > -1) {
        anesthesiologistsId.splice(index, 1)
        dispatch({
          type: ANESTHESIOLOGISTS_SCHEDULE_ACTION.SET_ANESTHESIOLOGISTS_SCHEDULE,
          payload: {
            [caseItem.caseId]: anesthesiologistsId,
          },
        })
        setLimitedCase({
          ...caseItem,
          anesthesiologistsId,
        })
      }
    })

    dispatch({
      type: OR_SCHEDULING_ACTION.REMOVE_ANESTHESIOLOGIST_FROM_ROOM,
      data: {
        orScheduleId,
        anesthesiologistId
      }
    })
  }
}

export const useLockCases = () => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const reschedule = useRescheduleCase()
  // TODO: use Promise.all
  return (caseIds: string[]) => {
    caseIds.forEach(caseId => {
      const activeCase = limitedCases[caseId]

      if (activeCase?.status === CaseStatus.PENDING)
        reschedule({
          caseId,
          status: CaseStatus.LOCKED,
          withoutBackup: true,
        })
    })
  }
}

export const useLockWeek = () => {
  const dispatch = useDispatch()
  const lock = useLockWeekApi()

  return async (date: Date) => {
    const response = await lock({
      formattedDate: format(date, dateString),
    })

    dispatch({
      type: SCHEDULING_ACTION.SET_LOCKED_WEEK,
      payload: {
        lockedWeekTimestamp: response.lockedWeekTimestamp,
        saveDateTime: getUnixTime(new Date()),
      },
    })
  }
}

export const useConfirmCases = () => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const dispatch = useDispatch()
  const reschedule = useRescheduleCase()
  const call = useCall()

  const confirmCases = (
    casesToConfirm: {
      caseId: string
      note: string
    }[],
  ) => call(async function confirmCases () {
    await Promise.all(
      casesToConfirm.map(async ({ caseId, note }) => {
        const activeCase = limitedCases[caseId]
        if (!activeCase) return
        if (
          activeCase?.status === CaseStatus.LOCKED ||
          activeCase?.status === CaseStatus.CHANGE_NOTIFIED ||
          activeCase?.status === CaseStatus.PENDING
        )
          reschedule({
            caseId,
            status: CaseStatus.CONFIRMED,
            confirmationNote: note,
            newOrId: activeCase.operatingRoomId ?? undefined,
          })
      }),
    )

    dispatch({
      type: GLOBAL_ACTION.ADD_TOAST,
      data: { type: 'success', text: trlb('toastSuccess_confirmCases') },
    })
  })

  return confirmCases
}

export interface OrtabItem {
  operatingRoomId: string
  name: string
}

export const useRecoverBookingsFromBackup = () => {
  const dispatch = useDispatch()
  const { caseBackup } = useAppSelector(state => state.scheduling)
  const rescheduleCase = useRescheduleCase()
  const resetCaseBackup = useResetBackup()

  return async (lockedWeekTimestamp: number, date: Date) => {
    Object.values(caseBackup?.[lockedWeekTimestamp] ?? {})?.forEach(c =>
      rescheduleCase({
        caseId: c.caseId,
        newDate: c.date,
        newOrId: c.orId,
        status: c.status,
        withoutBackup: true
      }))
    const formattedDate = format(date, dateString)
    await resetCaseBackup(formattedDate)
    dispatch({
      type: SCHEDULING_ACTION.RESET_BACKUPS,
      payload: {
        lockedWeekTimestamp,
      },
    })
  }
}

export enum View {
  day = 'day',
  week = 'week',
  month = 'month',
}

export const TimeSteps = {
  days: 'days',
  weeks: 'weeks',
  months: 'months'
} as const

export const useCalendarNavigation = (route: string, preferredView?: View | undefined) => {
  const navigate = useNavigate()
  const operatingRooms = Object.values(useAppSelector(state => state.operatingRooms))

  let { view: viewParam } = useParams()

  let view
  if (preferredView !== undefined) view = preferredView
  else view = View[(viewParam as View) ?? View.week]

  const setView = useCallback((newView: string) => navigate(route.replace(':view', newView)), [navigate, route])

  useEffect(() => {
    if (!view) setView('week')
    else if (view !== viewParam) setView(view)
  }, [operatingRooms, setView, view, viewParam])
  return {
    view,
    setView,
  }
}

export const useOrTabs = ({ cases }: { cases: ILimitedCase[] }) => {
  const selectedOrIds: string[] | null = useAppSelector(state => state.global.selectedOrIds)
  const dispatch = useDispatch()
  const user = useAppSelector(state => state.auth.user)
  const checkPermission = useGetCheckPermission()
  const canViewAssignedBookings = checkPermission(permissionRequests.canViewAssignedBookings)
  const operatingRooms = Object.values(useAppSelector(state => state.operatingRooms))

  const myCases = cases.filter(c => c.anesthesiologistsId?.includes(user.id) ||
   c.bookingSection.doctorId === user.id)
  const assignedRooms = myCases.map(c => c.operatingRoomId)
  const orTabList: OrtabItem[] = operatingRooms
    .filter(or => {
      if (canViewAssignedBookings) return assignedRooms.includes(or.operatingRoomId)

      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(or => ({
      operatingRoomId: or.operatingRoomId,
      name: or.name,
    }))

  const orIds = selectedOrIds == null
    ? orTabList.map(or => or.operatingRoomId)
    : orTabList.map(or => or.operatingRoomId)
      .filter(orId => selectedOrIds.includes(orId))

  const setOrIds = (orIds: string[]) => {
    dispatch({
      type: GLOBAL_ACTION.SET_OR_IDS,
      data: orIds,
    })
  }

  return {
    orTabList,
    orIds,
    setOrIds,
  }
}

export const useGetCalendarCases = () => {
  const getWeekBookings = useGetWeekBookings()
  const getDayBookings = useGetDayBookings()
  const getMonthBookings = useGetMonthBookings()

  const getCalendarCases = (timestep: string, date: Date) => {
    switch (timestep) {
      case 'weeks':
      case 'week':
        return getWeekBookings(date)
      case 'days':
      case 'day':
        return getDayBookings(date)
      case 'months':
      case 'month':
        return getMonthBookings(date)
      default:
        return []
    }
  }
  return {
    getCalendarCases,
  }
}

export const useCalendarCasesPolling = (view: string, date: Date) => {
  const { getCalendarCases } = useGetCalendarCases()
  const { fullScreen } = useAppSelector(state => state.global)

  React.useEffect(() => {
    if (!fullScreen || !view) return
    const interval = setInterval(() => {
      getCalendarCases(view, date)
    }, calendarPollingInterval)
    return () => clearInterval(interval)
  }, [date, fullScreen, view])
}

export const useSchedulingData = (date: Date) => {
  const getScheduledWeek = useGetScheduledWeek()
  const dispatch = useDispatch()
  const formattedDate = format(date, dateString)

  useEffect(() => {
    const getData = async () => {
      const data = await getScheduledWeek(formattedDate)
      if (data?.lockedWeek != null)
        dispatch({
          type: SCHEDULING_ACTION.SET_LOCKED_WEEK,
          payload: {
            lockedWeekTimestamp: data.lockedWeek.timeStamp,
            saveDateTime: data.lockedWeek.saveDateTimestamp,
          },
        })
      if (data?.caseBackup != null)
        dispatch({
          type: SCHEDULING_ACTION.SET_CASES_BACKUP,
          payload: data?.caseBackup,
        })
    }
    getData()
  }, [formattedDate])
}

export const useGetcasesThatCanIview = () => {
  const checkPermission = useGetCheckPermission()
  const canViewConfirmedBookings = checkPermission(permissionRequests.canViewConfirmedBookings)
  const canViewAllBookings = checkPermission(permissionRequests.canViewAllBookings)
  const limitedCases = useAppSelector(state => state.limitedCases)

  return (): ILimitedCase[] => {
    if (canViewConfirmedBookings)
      return Object.values(limitedCases)
        .filter(c => !statusesToExcludeWithConfirmedBooking.includes(c.status))

    return canViewAllBookings ? Object.values(limitedCases) : []
  }
}

export const useSaveAnesthesiologistsSchedule = () => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const dispatch = useDispatch()
  const canEditAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canEditAnesthesiologistsScheduling)
  const updateMultipleCasesAnesthesiologists = useUpdateMultipleCasesAnesthesiologists()
  const data = useAppSelector(state => state.anesthesiologistsSchedule)
  return () =>
    call(function SaveAnesthesiologistsSchedule () {
      if (!canEditAnesthesiologistsScheduling) return
      updateMultipleCasesAnesthesiologists(data)
      dispatch({
        type: ANESTHESIOLOGISTS_SCHEDULE_ACTION.CLEAR,
      })
    })
}

export const useDiscardAnesthesiologistsSchedule = () => {
  const dispatch = useDispatch()
  const { getCalendarCases } = useGetCalendarCases()
  return (date: Date) => {
    getCalendarCases('days', date)
    dispatch({
      type: ANESTHESIOLOGISTS_SCHEDULE_ACTION.CLEAR,
    })
  }
}

export const useGetPendingCases = (date: Date) => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const startOfWeekValue = React.useMemo(
    () =>
      add(startOfWeek(date, { weekStartsOn: 1 }), {
        seconds: -1,
      }),
    [date],
  )
  const endOfWeekValue = React.useMemo(
    () =>
      add(endOfWeek(date, { weekStartsOn: 1 }), {
        seconds: -1,
      }),
    [date],
  )

  const pendingCases = React.useMemo(() => {
    return Object.values(limitedCases).filter(
      c => isPendingCase(c) &&
       c.bookingSection.date > startOfWeekValue &&
        c.bookingSection.date < endOfWeekValue,
    )
  }, [limitedCases, startOfWeekValue, endOfWeekValue])
  return pendingCases
}
