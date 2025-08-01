/* eslint-disable no-unused-vars */
import { format, isValid, startOfDay, subMonths, subYears } from 'date-fns'
import { ICasesListColumn } from '../types'
import { permissionRequests } from './permissions'
import { getSurgeryName } from './cases'
import { getFullName } from '../formatters/users'

export const casesListTimePeriods: Record<string, { index: number;
  value: string;
  getValue: () => Date }> = {
  lastMonth: { index: 0, value: 'lastMonth', getValue: () => startOfDay(subMonths(new Date(), 1)) },
  lastThreeMonths: { index: 1, value: 'lastThreeMonths', getValue: () => startOfDay(subMonths(new Date(), 3)) },
  lastSixMonths: { index: 2, value: 'lastSixMonths', getValue: () => startOfDay(subMonths(new Date(), 6)) },
  lastYear: { index: 3, value: 'lastYear', getValue: () => startOfDay(subYears(new Date(), 1)) },
  lastTwoYears: { index: 4, value: 'lastTwoYears', getValue: () => startOfDay(subYears(new Date(), 2)) },
  lastThreeYears: { index: 5, value: 'lastThreeYears', getValue: () => startOfDay(subYears(new Date(), 3)) },
  lastFiveYears: { index: 6, value: 'lastFiveYears', getValue: () => startOfDay(subYears(new Date(), 5)) },
  all: { index: 7, value: 'all', getValue: () => new Date(0) },
}

export const casesListTimePeriodOptions = Object.values(casesListTimePeriods)
  .sort((a, b) => a.index - b.index)
  .map(({ value }) => ({ label: `cases_${value}_timePeriod`, value }))

export const casesListColumns: Record<string, ICasesListColumn> = {
  caseNumber: {
    index: 1,
    field: 'caseNumber',
    type: 'string',
  },
  surgeryName: {
    index: 2,
    field: 'snapshottedContract.opstandardsArray.name',
    vPermission: permissionRequests.canViewCasesListBookingInfoColumns,
    oPermission: permissionRequests.canViewCaseBookingInfo,
    valueGetter: (caseItem, props) => getSurgeryName({
      caseForm: caseItem,
      contracts: props?.contracts
    }),
    type: 'string',
    width: 230,
  },
  surgeryDate: {
    index: 3,
    field: 'bookingSection.date',
    vPermission: permissionRequests.canViewCasesListBookingInfoColumns,
    oPermission: permissionRequests.canViewCaseBookingInfo,
    valueGetter: (caseItem, props) =>
      isValid(new Date(caseItem.bookingSection?.date))
        ? format(new Date(caseItem.bookingSection.date), props?.dateString ?? 'dd/MM/yyyy')
        : '',
    type: 'date',
  },
  doctorName: {
    index: 4,
    field: 'associatedDoctor.lastName',
    vPermission: permissionRequests.canViewCasesListDoctorColumns,
    oPermission: permissionRequests.canViewCaseDoctor,
    valueGetter: caseItem =>
      caseItem?.bookingSection?.doctorId
        ? getFullName(caseItem.associatedDoctor, true)
        : '',
    renderCell: (params: any) => params?.row?.doctorName ?? '',
    type: 'string',
    width: 230,
  },
  patientName: {
    index: 5,
    field: 'bookingPatient.name',
    vPermission: permissionRequests.canViewCasesListPatientsColumns,
    // If I cannot view the real patient, I shouldn't be able to see the booking patient either
    oPermission: permissionRequests.canViewCasePatientAtFE,
    valueGetter: caseItem => `${caseItem.bookingPatient?.name ?? ''} ${caseItem.bookingPatient?.surname ?? ''}`,
    missingFilterOption: true,
    type: 'string',
    width: 230,
  },
  patientBirthDate: {
    index: 6,
    field: 'bookingPatient.birthDate',
    vPermission: permissionRequests.canViewCasesListPatientsColumns,
    // If I cannot view the real patient, I shouldn't be able to see the booking patient either
    oPermission: permissionRequests.canViewCasePatientAtFE,
    valueGetter: caseItem =>
      isValid(new Date(caseItem.bookingPatient?.birthDate)) ? new Date(caseItem.bookingPatient?.birthDate) : '',
    missingFilterOption: true,
    type: 'date',
  },
  patientId: {
    index: 7,
    field: 'bookingPatient.patientId',
    vPermission: permissionRequests.canViewCasesListPatientsColumns,
    // If I cannot view the real patient, I shouldn't be able to see the booking patient either
    oPermission: permissionRequests.canViewCasePatientAtFE,
    valueGetter: caseItem => caseItem?.bookingPatient?.patientId ?? '',
    missingFilterOption: true,
    type: 'string',
  },
  status: {
    index: 8,
    field: 'status',
    translated: true,
    vPermission: permissionRequests.canViewCasesListStatusColumns,
    oPermission: permissionRequests.canViewCaseStatus,
    type: 'string',
  },
}
