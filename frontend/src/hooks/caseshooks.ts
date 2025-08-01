import {
  associatePatientDto,
  calendarNotesTypes,
  calendarNotesSettings,
  Case,
  CaseFileToDelete,
  CaseForm,
  casesListTimePeriods,
  CaseStatus,
  formatCasesResponse,
  Identifier,
  ILimitedCase,
  lastCasesNumber,
  lockWeekDto,
  PaginatedCases,
  permissionRequests,
  scheduleCaseDTO,
  serializePatient,
  updateAnesthesiologistsDto,
  UpdateCaseDTO,
  updateMultipleCasesAnesthesiologistsDto,
  EPcMaterialsStatus,
} from '@smambu/lib.constants'
import { SchedulingCasesApi } from 'api/schedulingCases.api'
import { endOfDay, endOfWeek, startOfDay, startOfMonth, endOfMonth, isAfter, startOfWeek } from 'date-fns'
import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { CASES_ACTION, LIMITED_CASES_ACTION } from 'store/actions'
import useCall from './useCall'
import { useCheckPermission, useGetCheckPermission } from './userPermission'
import { useAppSelector } from 'store'
import { parsePatients } from './patientsHooks'
import { useGetContractsByIds } from './contractHooks'
import { GridSortModel } from '@mui/x-data-grid'
import { trlb } from 'utilities'

const paginationLimit = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT
const limitedCasesLimit = import.meta.env.VITE_FETCH_LIMITED_CASES_LIMIT

export const useSetCase = () => {
  const dispatch = useDispatch()
  const call = useCall()

  return (data: Case) =>
    call(function setCase () {
      dispatch({
        type: CASES_ACTION.SET_CASE,
        data,
      })
    })
}

export const useEditCase = () => {
  const setCase = useSetCase()
  const call = useCall()
  const associatePatient = useAssociatePatient()
  const cases = useAppSelector(state => state.cases)
  return (data: CaseForm,
    changedFields: string[],
    acceptedConflicts: string[],
    caseLoadedAtTS: Date) =>
    call(async function editCase () {
      try {
        const currentCase = cases[data.caseId]

        const updatePayload: UpdateCaseDTO = {
          caseData: {
            ...data,
            bookingPatient: serializePatient(data.bookingPatient),
          },
          changedFields,
          acceptedConflicts,
          caseLoadedAtTS: caseLoadedAtTS.toISOString(),
        }

        const updateResponse = await SchedulingCasesApi.editCase(data.caseId, updatePayload)

        const caseResponse = updateResponse.caseData

        if (!updateResponse.updated) return updateResponse

        let newData = formatCasesResponse([caseResponse!])[0]

        if (!acceptedConflicts.includes('patientRef') && !currentCase?.patientRef && data?.patientRef) {
          const associatePatientResponse = await associatePatient({
            caseId: data.caseId,
            patientId: data?.patientRef,
          })
          newData = formatCasesResponse([associatePatientResponse])[0]
        }

        setCase(newData)

        return {
          ...updateResponse,
          caseData: newData,
        }
      } catch (error) {
        console.error(error)
        throw error
      }
    })
}

export const useGetCasesWithoutPagination = ({
  patientId,
  statuses,
}: {
  patientId?: string
  statuses?: CaseStatus[]
}) => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()
  const dispatch = useDispatch()
  const cases = useAppSelector(state => state.cases)
  const [timePeriod, setTimePeriod] = React.useState(casesListTimePeriods.lastMonth.value)
  const fromDate = casesListTimePeriods[timePeriod].getValue()
  const getContractsByIds = useGetContractsByIds()
  const canViewCases = checkPermission(permissionRequests.canViewCases)

  React.useEffect(() => {
    if (!canViewCases) return
    async function getCases () {
      const cases = await SchedulingCasesApi.getCasesWithoutPagination({
        fromTimestamp: fromDate.getTime().toString(),
        statuses,
        patientId,
        datePattern: trlb('dateTime_date_string'),
      })
      const contractsIds = cases.reduce((acc, curr) => {
        const canViewContract = checkPermission(permissionRequests.canViewContract, {
          contract: {
            details: {
              doctorId: curr.bookingSection?.doctorId,
            },
          },
        })
        if (curr.bookingSection?.contractId &&
          !acc.includes(curr.bookingSection.contractId) &&
          canViewContract)
          return [...acc, curr.bookingSection.contractId]

        return acc
      }, [])
      await getContractsByIds({ contractsIds })
      dispatch({
        type: CASES_ACTION.SET_CASES,
        data: formatCasesResponse(cases),
      })
    }
    call(getCases)
  }, [canViewCases, timePeriod, patientId])

  return {
    cases: Object.values(cases)
      .filter((caseItem: Case) => isAfter(caseItem.bookingSection.date, fromDate))
      .reduce((acc, curr) => ({ ...acc, [curr.caseId]: curr }),
        {}) as { [caseId: Identifier]: Case },
    timePeriod,
    setTimePeriod,
  }
}

export const useScheduleCase = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()

  const canAccessScheduling = checkPermission(permissionRequests.canAccessScheduling)

  return (caseId: string, data: scheduleCaseDTO) =>
    call(async function getCases () {
      if (!canAccessScheduling) return

      const res = await SchedulingCasesApi.scheduleCase(caseId, data)

      return res
    })
}

export const useLockWeekApi = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()

  const canAccessScheduling = checkPermission(permissionRequests.canAccessScheduling)

  return (data: lockWeekDto) =>
    call(async function lockWeek () {
      if (!canAccessScheduling) return

      const res = await SchedulingCasesApi.lockWeek(data)

      return res
    })
}

export const parseScheduledWeek = scheduledWeek => {
  return {
    ...scheduledWeek,
    caseBackup: {
      ...scheduledWeek.caseBackup,
      cases: scheduledWeek?.caseBackup?.cases?.map(c => ({
        ...c,
        date: new Date(c.date),
      })),
    },
  }
}
export const useGetScheduledWeek = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()

  const canSchedule = checkPermission(permissionRequests.canSchedule)

  return (dateString: string) =>
    call(async function getScheduledWeek () {
      if (!canSchedule) return

      const res = await SchedulingCasesApi.getScheduledWeek(dateString)

      return parseScheduledWeek(res)
    })
}

export const useResetBackup = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()

  const canSchedule = checkPermission(permissionRequests.canSchedule)

  return (dateString: string) =>
    call(async function resetBackup () {
      if (!canSchedule) return

      const res = await SchedulingCasesApi.resetBackup(dateString)

      return res
    })
}

export const useFetchCases = (
  page: number,
  setPage: (page: number) => void,
  limit: number,
  setLimit: (limit: number) => void,
  sortModel: GridSortModel,
  setSortModel: (model: GridSortModel) => void,
  fulltextsearch?: string,
  fromTimestamp?: string,
  toTimestamp?: string,
  statuses?: CaseStatus[],
  doctorId?: string,
  patientId?: string,
  missingFieldsFilter?: string[],
  missingInfoFilter?: string[],
  pcMaterialsStatuses?: EPcMaterialsStatus[],
) => {
  const call = useCall()
  const canViewPatients = useCheckPermission(permissionRequests.canViewCases)

  const [results, setResults] = React.useState<ILimitedCase[]>([])
  const [total, setTotal] = React.useState(0)

  const response = React.useMemo(() => ({
    results,
    total,
    limit,
    currentPage: page,
  }), [results, total, limit, page])

  const setResponse = (data: PaginatedCases) => {
    setResults(data.results)
    setTotal(data.total)
    setLimit(data.limit)
    setPage(data.currentPage)
  }

  const [selectedCases, setSelectedCases] = React.useState<ILimitedCase[]>([])

  React.useEffect(() => {
    if (!canViewPatients) return
    call(async function fullTextSearchCases () {
      const res = await SchedulingCasesApi.getCases({
        page: !isNaN(page) ? page : 0,
        limit: response.limit || paginationLimit,
        search: fulltextsearch,
        sortBy: sortModel[0]?.field,
        sortOrder: sortModel[0]?.sort,
        datePattern: trlb('dateTime_date_string'),
        fromTimestamp,
        toTimestamp,
        statuses,
        doctorId,
        patientId,
        missingFieldsFilter,
        missingInfoFilter,
        limitedCases: true,
        pcMaterialsStatuses,
      })

      setResponse({
        ...res,
        results: formatCasesResponse(res.results),
      })
      setSelectedCases([])
    })
  }, [
    fulltextsearch,
    statuses,
    fromTimestamp,
    toTimestamp,
    doctorId,
    patientId,
    missingFieldsFilter,
    missingInfoFilter,
    pcMaterialsStatuses,
  ])

  const onRowSelect = (value: string[]) => {
    const newSelectedCases = value.map(id => response.results.find(c => c.caseId === id) ??
      selectedCases.find(c => c.caseId === id) ?? null)
      .filter(c => c !== null) as ILimitedCase[]
    setSelectedCases(newSelectedCases)
  }

  const onPageChange = (page: number) => {
    call(async function onPageChange () {
      if (isNaN(page)) return
      const res = await await SchedulingCasesApi.getCases({
        page,
        limit: response.limit || paginationLimit,
        search: fulltextsearch,
        sortBy: sortModel[0]?.field,
        sortOrder: sortModel[0]?.sort,
        datePattern: trlb('dateTime_date_string'),
        fromTimestamp,
        toTimestamp,
        statuses,
        doctorId,
        patientId,
        missingFieldsFilter,
        missingInfoFilter,
        limitedCases: true,
        pcMaterialsStatuses,
      })

      setResponse({
        ...res,
        results: formatCasesResponse(res.results),
      })
    })
  }

  const onSortModelChange = (model: GridSortModel) => {
    call(async function onSortModelChange () {
      setSortModel(model)
      const res = await SchedulingCasesApi.getCases({
        page: !isNaN(page) ? page : 0,
        limit: response.limit || paginationLimit,
        search: fulltextsearch,
        sortBy: model[0]?.field,
        sortOrder: model[0]?.sort,
        datePattern: trlb('dateTime_date_string'),
        fromTimestamp,
        toTimestamp,
        statuses,
        doctorId,
        patientId,
        missingFieldsFilter,
        missingInfoFilter,
        limitedCases: true,
        pcMaterialsStatuses,
      })

      setResponse({
        ...res,
        results: formatCasesResponse(res.results),
      })
    })
  }

  const onPageSizeChange = (pageSize: number) => {
    call(async function onPageSizeChange () {
      if (isNaN(pageSize)) return
      setResponse({ ...response, limit: pageSize })
      const res = await SchedulingCasesApi.getCases({
        page: !isNaN(page) ? page : 0,
        limit: pageSize,
        search: fulltextsearch,
        sortBy: sortModel[0]?.field,
        sortOrder: sortModel[0]?.sort,
        datePattern: trlb('dateTime_date_string'),
        fromTimestamp,
        toTimestamp,
        statuses,
        doctorId,
        patientId,
        missingFieldsFilter,
        missingInfoFilter,
        limitedCases: true,
        pcMaterialsStatuses,
      })

      setResponse({
        ...res,
        results: parsePatients(res.results),
      })
    })
  }

  return {
    cases: response.results,
    currentPage: response.currentPage,
    limit: response.limit,
    total: response.total,
    sortModel,
    selectedCases,
    onPageChange,
    onSortModelChange,
    onPageSizeChange,
    onRowSelect,
  }
}

export const useGetPatientCases = (patientId: string) => {
  const checkPermission = useGetCheckPermission()
  const dispatch = useDispatch()
  const getContractsByIds = useGetContractsByIds()
  const call = useCall()

  const canViewCases = checkPermission(permissionRequests.canViewCases)
  const canViewBookings = checkPermission(permissionRequests.canViewBooking)

  const getCases = (patientId: string) =>
    call(async function getPatientCases () {
      if (!canViewCases && !canViewBookings) return
      const results = []
      let page = 0
      let res = await SchedulingCasesApi.getCases({
        patientId,
        page,
        limit: paginationLimit,
        datePattern: trlb('dateTime_date_string'),
      })
      results.push(...res.results)
      page = page + 1

      if (res.results.length < res.total)
        while (results.length < res.total) {
          res = await SchedulingCasesApi.getCases({
            patientId,
            page,
            limit: paginationLimit,
            datePattern: trlb('dateTime_date_string'),
          })
          results.push(...res.results)
          page = page + 1
        }
      const contractsIds = results.reduce((acc, curr) => {
        const canViewContract = checkPermission(permissionRequests.canViewContract, {
          contract: {
            details: {
              doctorId: curr.bookingSection?.doctorId,
            },
          },
        })
        if (curr.bookingSection?.contractId &&
          !acc.includes(curr.bookingSection.contractId) &&
          canViewContract)
          return [...acc, curr.bookingSection.contractId]

        return acc
      }, [])
      await getContractsByIds({ contractsIds })
      dispatch({
        type: CASES_ACTION.SET_CASES,
        data: formatCasesResponse(results),
      })
    })

  useEffect(() => {
    if (!patientId) return
    if (!canViewCases && !canViewBookings) return
    getCases(patientId)
  }, [patientId, canViewCases, canViewBookings])
}

export const useGetWeekBookings = () => {
  const checkPermission = useGetCheckPermission()
  const dispatch = useDispatch()
  const call = useCall()
  const getContractsByIds = useGetContractsByIds()
  const canViewBookings = checkPermission(permissionRequests.canViewBookings)

  return (date: Date) =>
    call(async function getWeekCases () {
      if (!canViewBookings) return
      const results = []
      let page = 0
      let res = await SchedulingCasesApi.getCases({
        fromTimestamp: startOfWeek(date, {
          weekStartsOn: 1,
        })
          .getTime()
          .toString(),
        toTimestamp: endOfWeek(date, {
          weekStartsOn: 1,
        })
          .getTime()
          .toString(),
        page,
        limit: limitedCasesLimit,
        datePattern: trlb('dateTime_date_string'),
        limitedCases: true,
        hideClosedCases: true
      })
      results.push(...res.results)
      page = page + 1

      if (res.results.length < res.total)
        while (results.length < res.total) {
          res = await SchedulingCasesApi.getCases({
            fromTimestamp: startOfWeek(date, {
              weekStartsOn: 1,
            })
              .getTime()
              .toString(),
            toTimestamp: endOfWeek(date, {
              weekStartsOn: 1,
            })
              .getTime()
              .toString(),
            page,
            limit: limitedCasesLimit,
            datePattern: trlb('dateTime_date_string'),
            limitedCases: true,
            hideClosedCases: true
          })
          results.push(...res.results)
          page = page + 1
        }

      const contractsIds = results.reduce((acc, curr) => {
        const canViewContract = checkPermission(permissionRequests.canViewContract, {
          contract: {
            details: {
              doctorId: curr.bookingSection?.doctorId,
            },
          },
        })
        if (curr.bookingSection?.contractId &&
          !acc.includes(curr.bookingSection.contractId) &&
           canViewContract)
          return [...acc, curr.bookingSection.contractId]

        return acc
      }, [])
      await getContractsByIds({ contractsIds })
      dispatch({
        type: LIMITED_CASES_ACTION.SET_CASES,
        data: formatCasesResponse(results),
      })
    })
}

export const useGetDayBookings = () => {
  const checkPermission = useGetCheckPermission()
  const dispatch = useDispatch()
  const call = useCall()
  const getContractsByIds = useGetContractsByIds()
  const canViewBookings = checkPermission(permissionRequests.canViewBookings)

  return (date: Date) =>
    call(async function getDayCases () {
      if (!canViewBookings) return
      const results = []
      let page = 0
      let res = await SchedulingCasesApi.getCases({
        fromTimestamp: startOfDay(date).getTime()
          .toString(),
        toTimestamp: endOfDay(date).getTime()
          .toString(),
        page,
        limit: limitedCasesLimit,
        datePattern: trlb('dateTime_date_string'),
        limitedCases: true,
        hideClosedCases: true
      })
      results.push(...res.results)
      page = page + 1

      if (res.results.length < res.total)
        while (results.length < res.total) {
          res = await SchedulingCasesApi.getCases({
            fromTimestamp: startOfDay(date).getTime()
              .toString(),
            toTimestamp: endOfDay(date).getTime()
              .toString(),
            page,
            limit: limitedCasesLimit,
            datePattern: trlb('dateTime_date_string'),
            limitedCases: true,
            hideClosedCases: true
          })
          results.push(...res.results)
          page = page + 1
        }

      const contractsIds = results.reduce((acc, curr) => {
        const canViewContract = checkPermission(permissionRequests.canViewContract, {
          contract: {
            details: {
              doctorId: curr.bookingSection?.doctorId,
            },
          },
        })
        if (curr.bookingSection?.contractId &&
          !acc.includes(curr.bookingSection.contractId) &&
          canViewContract)
          return [...acc, curr.bookingSection.contractId]

        return acc
      }, [])
      await getContractsByIds({ contractsIds })
      dispatch({
        type: LIMITED_CASES_ACTION.SET_CASES,
        data: formatCasesResponse(results),
      })
    })
}

export const useGetMonthBookings = () => {
  const checkPermission = useGetCheckPermission()
  const dispatch = useDispatch()
  const call = useCall()
  const getContractsByIds = useGetContractsByIds()
  const canViewBookings = checkPermission(permissionRequests.canViewBookings)

  return (date: Date) =>
    call(async function getMonthCases () {
      if (!canViewBookings) return
      const results = []
      let page = 0
      let res = await SchedulingCasesApi.getCases({
        fromTimestamp: startOfMonth(date).getTime()
          .toString(),
        toTimestamp: endOfMonth(date).getTime()
          .toString(),
        page,
        limit: limitedCasesLimit,
        datePattern: trlb('dateTime_date_string'),
        limitedCases: true,
        hideClosedCases: true
      })
      results.push(...res.results)
      page = page + 1

      if (res.results.length < res.total)
        while (results.length < res.total) {
          res = await SchedulingCasesApi.getCases({
            fromTimestamp: startOfMonth(date).getTime()
              .toString(),
            toTimestamp: endOfMonth(date).getTime()
              .toString(),
            page,
            limit: limitedCasesLimit,
            datePattern: trlb('dateTime_date_string'),
            limitedCases: true,
            hideClosedCases: true
          })
          results.push(...res.results)
          page = page + 1
        }

      const contractsIds = results.reduce((acc, curr) => {
        const canViewContract = checkPermission(permissionRequests.canViewContract, {
          contract: {
            details: {
              doctorId: curr.bookingSection?.doctorId,
            },
          },
        })
        if (curr.bookingSection?.contractId &&
           !acc.includes(curr.bookingSection.contractId) &&
            canViewContract)
          return [...acc, curr.bookingSection.contractId]

        return acc
      }, [])
      await getContractsByIds({ contractsIds })
      dispatch({
        type: LIMITED_CASES_ACTION.SET_CASES,
        data: formatCasesResponse(results),
      })
    })
}

export const useAssociatePatient = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()
  const dispatch = useDispatch()
  const canSetCheckinTimestamp = checkPermission(permissionRequests.canSetCheckinTimestamp)
  const allCases = useAppSelector(state => state.cases)

  return (data: associatePatientDto) =>
    call(async function getCases () {
      if (!canSetCheckinTimestamp) return
      const res = await SchedulingCasesApi.associatePatient(data)
      const currentCase = allCases[data.caseId]
      dispatch({
        type: CASES_ACTION.SET_CASE,
        data: {
          ...currentCase,
          patientRef: res.patientId,
          associatedPatient: parsePatients([res])[0],
          bookingPatient: parsePatients([res])[0],
        },
      })
      return parsePatients([res])[0]
    })
}

export const useGetCaseById = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()
  const dispatch = useDispatch()
  const getContractsByIds = useGetContractsByIds()
  const canViewCases = checkPermission(permissionRequests.canViewCases)

  return (caseId: string) =>
    call(async function getCases () {
      if (!canViewCases) return
      const caseItem = await SchedulingCasesApi.getCaseById(caseId)
      const contractId = caseItem.bookingSection?.contractId
      if (contractId != null)
        await getContractsByIds({ contractsIds: [caseItem.bookingSection?.contractId] })
      dispatch({
        type: CASES_ACTION.SET_CASE,
        data: formatCasesResponse([caseItem])[0],
      })

      return caseItem
    }, false)
}

export const useGetContractLastCase = (contractId?: string) => {
  const call = useCall()
  const [lastCase, setLastCase] = useState<Case | undefined>()

  useEffect(() => {
    const fetchLastCase = () =>
      call(async function getCases () {
        if (contractId === undefined) return undefined

        const res = await SchedulingCasesApi.getContractLastCase(contractId)

        return formatCasesResponse([res])[0]
      })

    fetchLastCase().then(formattedCase => setLastCase(formattedCase))
  }, [contractId])

  return lastCase
}

export const useUpdateAnesthesiologists = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()

  const canEditAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canEditAnesthesiologistsScheduling)

  return (caseId: string, data: updateAnesthesiologistsDto) =>
    call(async function updateAnesthesiologists () {
      if (!canEditAnesthesiologistsScheduling) return
      const res = await SchedulingCasesApi.updateAnesthesiologists(caseId, data)
      return res
    })
}

export const useUpdateMultipleCasesAnesthesiologists = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()

  const canEditAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canEditAnesthesiologistsScheduling)

  return (data: updateMultipleCasesAnesthesiologistsDto) =>
    call(async function updateMultipleCasesAnesthesiologists () {
      if (!canEditAnesthesiologistsScheduling) return
      const res = await SchedulingCasesApi.updateMultipleCasesAnesthesiologists(data)
      return res
    })
}

export const useEditCaseDuration = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()
  const dispatch = useDispatch()
  const limitedCases = useAppSelector(state => state.limitedCases)

  return (caseId: string, duration: number): Promise<{ duration: number }> =>
    call(async function updateMultipleCasesAnesthesiologists () {
      const caseItem = limitedCases[caseId]
      const canEditCaseDuration = checkPermission(permissionRequests.canEditCasesBookingInfo,
        { caseItem })
      if (!canEditCaseDuration) return
      try {
        const response = await SchedulingCasesApi.editCaseDuration(caseId, duration)

        if (response.duration == null) throw new Error('Error while updating case duration. Please try again later.')
        dispatch({
          type: LIMITED_CASES_ACTION.SET_CASE,
          data: {
            ...caseItem,
            bookingSection: {
              ...caseItem.bookingSection,
              duration: response.duration,
            },
          },
        })
        return response
      } catch (error) {
        console.error(error)
      }
    })
}

export const useEditCaseCalendarNotes = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()
  const dispatch = useDispatch()
  const limitedCases = useAppSelector(state => state.limitedCases)

  const editCaseCalendarNotes = (type: calendarNotesTypes, caseId: string, notes: string) =>
    call(async function editCaseCalendarNotes () {
      const settings = calendarNotesSettings[type]
      const canEditCalendarNotes = checkPermission(settings.editPermission)
      if (!canEditCalendarNotes) throw new Error('You do not have permission to edit case calendar notes.')
      const response = await SchedulingCasesApi.editCaseCalendarNotes(caseId, notes, type)
      dispatch({
        type: LIMITED_CASES_ACTION.SET_CASE,
        data: {
          ...limitedCases[caseId],
          bookingSection: {
            ...limitedCases[caseId].bookingSection,
            [type]: response.notes,
          }
        },
      })
      return response
    })

  return editCaseCalendarNotes
}

export const useApproveChangeNotified = () => {
  const checkPermission = useGetCheckPermission()
  const call = useCall()
  const dispatch = useDispatch()
  const canEditCasesBookingInfo = checkPermission(permissionRequests.canEditCasesBookingInfo)
  const limitedCases = useAppSelector(state => state.limitedCases)
  return (caseId: string) =>
    call(async function updateMultipleCasesAnesthesiologists () {
      if (!canEditCasesBookingInfo) return
      try {
        await SchedulingCasesApi.approveChangeNotified(caseId)
        const c = limitedCases[caseId]
        dispatch({
          type: LIMITED_CASES_ACTION.SET_CASE,
          data: {
            ...c,
            status: CaseStatus.CONFIRMED,
          },
        })
      } catch (error) {
        console.error(error)
      }
    })
}

export const useGetLastCases = () => {
  const checkPermission = useGetCheckPermission()
  const dispatch = useDispatch()
  const call = useCall()
  const getContracts = useGetContractsByIds()
  const canViewCases = checkPermission(permissionRequests.canViewCases)

  return () =>
    call(async function getLastCases () {
      if (!canViewCases) return
      let results = await SchedulingCasesApi.getLastCases({ limit: lastCasesNumber })

      const contractsIds = results.reduce((acc, curr) => {
        const canViewContract = checkPermission(permissionRequests.canViewContract, {
          contract: {
            details: {
              doctorId: curr.bookingSection?.doctorId,
            },
          },
        })
        if (curr.bookingSection?.contractId &&
          !acc.includes(curr.bookingSection.contractId) &&
          canViewContract)
          return [...acc, curr.bookingSection.contractId]

        return acc
      }, [])
      await getContracts({ contractsIds })
      dispatch({
        type: CASES_ACTION.SET_CASES,
        data: formatCasesResponse(results),
      })
    })
}

export const useDeleteFiles = () => {
  const call = useCall()

  return (caseId: string, files: CaseFileToDelete[]) =>
    call(async function deleteFiles () {
      const res = await SchedulingCasesApi.deleteCaseFiles({
        caseId,
        filesToDelete: files,
      })

      return res
    })
}

export const useReviewCase = () => {
  const call = useCall()
  const reviewCase = useCallback(
    (caseId: string) =>
      call(async function reviewCase () {
        const res = await SchedulingCasesApi.reviewCase(caseId)
        return res
      }),
    [],
  )
  return reviewCase
}

export const useGetOpstandardUtilization = (opstandardId?: string) => {
  const call = useCall()
  const [uses, setUses] = useState(0)

  useEffect(() => {
    const getUses = () =>
      call(async function getOpstandardUses () {
        if (opstandardId === undefined) return 0

        const caseUsingIt = await SchedulingCasesApi.getOpstandardUtilization(opstandardId)

        return caseUsingIt
      })

    getUses().then((_uses: number) => setUses(_uses))
  }, [opstandardId])

  return uses
}

export const useGetCasesCSV = (
  fulltextsearch?: string,
  fromTimestamp?: string,
  toTimestamp?: string,
  statuses?: CaseStatus[],
  doctorId?: string,
  patientId?: string,
  missingFieldsFilter?: string[],
  missingInfoFilter?: string[],
  pcMaterialsStatuses?: EPcMaterialsStatus[],
) => {
  const call = useCall()
  const canViewPatients = useCheckPermission(permissionRequests.canViewCases)

  const getExportedData = useCallback(
    (): Promise<ILimitedCase[]> =>
      call(async function getCsvCases () {
        if (!canViewPatients) return []
        const res = await SchedulingCasesApi.getCasesCSV({
          search: fulltextsearch,
          datePattern: trlb('dateTime_date_string'),
          fromTimestamp,
          toTimestamp,
          statuses,
          doctorId,
          patientId,
          missingFieldsFilter,
          missingInfoFilter,
          limitedCases: true,
          pcMaterialsStatuses,
        })

        return formatCasesResponse(res.results)
      }), [
      fulltextsearch,
      statuses,
      fromTimestamp,
      toTimestamp,
      doctorId,
      patientId,
      missingFieldsFilter,
      missingInfoFilter,
    ]
  )

  return getExportedData
}
