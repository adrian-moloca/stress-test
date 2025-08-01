import { PatientsApi } from 'api/patients.api'
import useCall from './useCall'
import {
  Address,
  CaseForm,
  NaiveDate,
  PaginatedPatientsResponse,
  Patient,
  formatDateNaive,
  permissionRequests,
} from '@smambu/lib.constants'
import { useAssociatePatient } from './caseshooks'
import { useCheckPermission, useGetCheckPermission } from './userPermission'
import React from 'react'
import { FormikProps } from 'formik'
import { GridSortModel } from '@mui/x-data-grid'
import { isSameDay, isValid } from 'date-fns'

const paginationLimit = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT

export const parsePatients = (patients: Patient[]) => {
  if (!patients) return []
  return patients.map(patient => ({
    ...patient,
    birthDate: new Date(patient.birthDate),
  }))
}
export const useCreatePatient = () => {
  const call = useCall()
  return (data: Patient) =>
    call(async function createPatient () {
      const patient = await PatientsApi.createPatient({
        ...data,
        birthDate: data.birthDate ? formatDateNaive(new Date(data.birthDate)) : null,
      })
      return parsePatients([patient])[0]
    })
}

export const useCreateAndAssociatePatient = () => {
  const call = useCall()
  const associatePatient = useAssociatePatient()
  return (caseId: string, data: Patient) =>
    call(async function createPatient () {
      const patient = await PatientsApi.createPatient({
        ...data,
        birthDate: data.birthDate ? formatDateNaive(new Date(data.birthDate)) : null,
      })
      await associatePatient({
        caseId,
        patientId: patient.id,
      })
      return parsePatients([patient])[0]
    })
}

export const useGetPatients = (data: {
  name?: string
  surname?: string
  birthDate?: Date | NaiveDate
  address?: Address
}) => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const canViewPatients = checkPermission(permissionRequests.canViewPatients)

  const [list, setList] = React.useState<Patient[]>()

  React.useEffect(() => {
    if (!canViewPatients) return

    call(async function getPatients () {
      const patients = await PatientsApi.getFilteredPatients({
        ...data,
        ...(data.birthDate != null &&
          isValid(new Date(data.birthDate)) && {
          birthDate: formatDateNaive(new Date(data.birthDate)),
        }),
      })
      setList(parsePatients(patients))
    })
  }, [data.birthDate,
    data.name,
    data.surname,
    data.address,
    canViewPatients])

  return list
}

export const useFetchPatients = (fulltextsearch: string, page: number) => {
  const call = useCall()
  const canViewPatients = useCheckPermission(permissionRequests.canViewPatients)

  const [response, setResponse] = React.useState<PaginatedPatientsResponse>({
    results: [],
    currentPage: 0,
    limit: 0,
    total: 0,
  })

  const [sortModel, setSortModel] = React.useState<GridSortModel>([])

  React.useEffect(() => {
    if (!canViewPatients) return
    call(async function fullTextSearchPatients () {
      const res = await PatientsApi.fetchPatients(
        fulltextsearch,
        !isNaN(page) ? page : 0,
        response.limit || paginationLimit,
        sortModel[0]?.field,
        sortModel[0]?.sort,
      )
      setResponse({
        ...res,
        results: parsePatients(res.results),
      })
    })
  }, [fulltextsearch])

  const onPageChange = (page: number) => {
    call(async function onPageChange () {
      if (isNaN(page)) return
      const res = await PatientsApi.fetchPatients(
        fulltextsearch,
        page,
        response.limit || paginationLimit,
        sortModel[0]?.field,
        sortModel[0]?.sort,
      )
      setResponse({
        ...res,
        results: parsePatients(res.results),
      })
    })
  }

  const onSortModelChange = (model: GridSortModel) => {
    call(async function onSortModelChange () {
      setSortModel(model)
      const res = await PatientsApi.fetchPatients(
        fulltextsearch,
        page,
        response.limit || paginationLimit,
        model[0]?.field,
        model[0]?.sort,
      )
      setResponse({
        ...res,
        results: parsePatients(res.results),
      })
    })
  }

  const onPageSizeChange = (pageSize: number) => {
    call(async function onPageSizeChange () {
      if (isNaN(pageSize)) return
      const res = await PatientsApi.fetchPatients(
        fulltextsearch,
        page,
        pageSize,
        sortModel[0]?.field,
        sortModel[0]?.sort,
      )
      setResponse({
        ...res,
        results: parsePatients(res.results),
        limit: pageSize,
      })
    })
  }

  return {
    patients: response.results,
    currentPage: response.currentPage,
    limit: response.limit,
    total: response.total,
    sortModel,
    onPageChange,
    onSortModelChange,
    onPageSizeChange,
  }
}

export const useFetchPatient = (id?: string) => {
  const call = useCall()
  const canViewPatients = useCheckPermission(permissionRequests.canViewPatients)

  const [item, setItem] = React.useState<Patient | null>(null)

  React.useEffect(() => {
    if (!canViewPatients) return
    if (id)
      call(async function fullTextSearchPatients () {
        const res = await PatientsApi.fetchPatient(id)
        setItem(parsePatients([res])[0])
      }, false)
    else setItem(null)
  }, [id, canViewPatients])

  return item
}

export const useUpdatePatient = () => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  return (data: Patient) =>
    call(async function updatePatient () {
      const canEditPatient = checkPermission(permissionRequests.canEditPatient, {
        patient: data,
      })
      if (!canEditPatient) return
      await PatientsApi.updatePatient({
        ...data,
        birthDate: data.birthDate ? formatDateNaive(new Date(data.birthDate)) : null,
      })
    })
}

type Row = {
  id: string
  nameSurname: string
  birthDate: string
  email: string
  address: string
}

export const useGetAssociatePatientsTableRows = (form: FormikProps<CaseForm>,
  patients: Patient[]) => {
  const rows: Row[] = (patients || [])
    .filter(
      (patient: Patient) =>
        (patient?.name.toLowerCase().includes(form.values.bookingPatient?.name?.toLowerCase()) &&
          patient?.surname.toLowerCase()
            .includes(form.values.bookingPatient?.surname?.toLowerCase()) &&
          isSameDay(new Date(patient?.birthDate),
            new Date(form.values.bookingPatient?.birthDate))) ||
        (patient?.address?.city
          ?.toLowerCase() === form.values.bookingPatient?.address?.city?.toLowerCase() &&
          patient?.address?.street
            ?.toLowerCase() === form.values.bookingPatient?.address?.street?.toLowerCase() &&
          patient?.address?.houseNumber?.toLowerCase() ===
            form.values.bookingPatient?.address?.houseNumber?.toLowerCase() &&
          patient?.address?.postalCode?.toLowerCase() ===
            form.values.bookingPatient?.address?.postalCode?.toLowerCase() &&
          patient?.address?.country
            ?.toLowerCase() === form.values.bookingPatient?.address?.country?.toLowerCase()),
    )
    .map((patient: Patient) => ({
      id: patient.patientId,
      nameSurname: patient?.name && patient?.surname ? `${patient.name} ${patient.surname}` : '',
      birthDate: patient.birthDate.toLocaleDateString(),
      email: patient.email,
      address: `${patient?.address?.street} ${patient?.address?.houseNumber}, ${patient?.address?.city}`,
    }))
  return rows
}
