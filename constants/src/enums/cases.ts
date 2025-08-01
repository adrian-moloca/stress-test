/* eslint-disable no-unused-vars */
import { isSameDay, isSameMinute } from 'date-fns'
import { Case, CaseForm, IContractState, ILimitedCase } from '../types'
import { CaseStatus } from './others'
import { permissionRequests } from './permissions'

export const getCaseContract = ({
  includeOriginalOP,
  caseForm,
  contracts,
}: {
  includeOriginalOP?: boolean
  caseForm?: CaseForm | Case | ILimitedCase
  contracts?: IContractState
}) => {
  const contractId = caseForm?.bookingSection?.contractId
  const contractIdOk = contractId !== undefined && contractId !== null
  if (caseForm != null && 'snapshottedContract' in caseForm === false)
    return contractIdOk ? contracts?.[contractId] : null

  const caseItem = caseForm as Case
  const contractDiffered = contractId !== caseItem?.snapshottedContract?.contractId

  if (contractDiffered) return contractIdOk ? contracts?.[contractId] : null

  const snapshottedContract = caseItem?.snapshottedContract

  if (snapshottedContract === undefined || snapshottedContract.contractId === undefined) return null

  if (includeOriginalOP && contracts !== undefined) {
    const originalContract = contracts[snapshottedContract.contractId]

    snapshottedContract.opStandards = {
      ...originalContract.opStandards,
      ...caseItem?.snapshottedContract.opStandards,
    }
  }

  return snapshottedContract
}

export const getCaseOpStandard = ({
  caseForm,
  contracts,
}: {
  caseForm?: CaseForm | Case
  contracts?: IContractState
}) => getCaseContract({ caseForm, contracts })?.opStandards?.[caseForm?.bookingSection?.opStandardId ?? '']

export const getSurgeryName = ({
  caseForm,
  contracts,
}: {
  caseForm?: CaseForm | Case | ILimitedCase
  contracts?: IContractState
}): string => {
  if ((caseForm as ILimitedCase)?.surgeryName != null)
    return (caseForm as ILimitedCase).surgeryName!

  return getCaseOpStandard({ caseForm: caseForm as Case, contracts })?.name ?? ''
}

export const getSnapshottedSurgeryName = (caseForm: Case) =>
  caseForm.snapshottedContract?.opStandards?.[caseForm.bookingSection.opStandardId ?? '']?.name

export const isCaseBilled = (caseStatus: CaseStatus) => billedStatuses.includes(caseStatus)

export const isPendingCase = (caseItem: Case | ILimitedCase) =>
  (!caseItem.operatingRoomId || !caseItem.bookingSection.doctorId) &&
  caseItem.status !== CaseStatus.ON_HOLD &&
  caseItem.status !== CaseStatus.CHANGE_REQUESTED

export const caseStatusOrder = [
  CaseStatus.PATIENT_ARRIVED,
  CaseStatus.IN_PRE_OP,
  CaseStatus.READY_FOR_ANESTHESIA,
  CaseStatus.IN_OR,
  CaseStatus.READY_FOR_SURGERY,
  CaseStatus.IN_SURGERY,
  CaseStatus.FINISHED_SURGERY,
  CaseStatus.IN_RECOVERY,
  CaseStatus.LEFT_OR,
  CaseStatus.IN_POST_OP,
  CaseStatus.READY_FOR_DISCHARGE,
  CaseStatus.DISCHARGED,
]

export const caseStatusSurgeryInfoEditables = [
  CaseStatus.PENDING,
  CaseStatus.LOCKED,
  CaseStatus.CHANGE_REQUESTED,
]

export enum statusTimestamps {
  PATIENT_ARRIVED = 'patientArrivalTimestamp',
  IN_PRE_OP = 'preopStartedTimestamp',
  READY_FOR_ANESTHESIA = 'preopFinishedTimestamp',
  IN_OR = 'roomEnterTimestamp',
  READY_FOR_SURGERY = 'anesthesiaFinishedTimestap',
  IN_SURGERY = 'surgeryStartTimestamp',
  FINISHED_SURGERY = 'surgeryEndTimestamp',
  IN_RECOVERY = 'readyForRecoveryTimestamp',
  LEFT_OR = 'roomExitTimestmap',
  IN_POST_OP = 'postOpStartedTimestap',
  READY_FOR_DISCHARGE = 'postOpFinishedTimestap',
  DISCHARGED = 'dischargedTimestamp',
}

export const billingPageCaseStatuses = [
  CaseStatus.INFORMATION_INCOMPLETE,
  CaseStatus.BILLABLE,
  CaseStatus.REVIEWED,
  CaseStatus.PARTIALLY_BILLED,
  CaseStatus.BILLED_EXTERNALLY,
  CaseStatus.BILLED,
  CaseStatus.PATIENT_ARRIVED,
  CaseStatus.READY_FOR_ANESTHESIA,
  CaseStatus.IN_OR,
  CaseStatus.READY_FOR_SURGERY,
  CaseStatus.IN_SURGERY,
  CaseStatus.FINISHED_SURGERY,
  CaseStatus.IN_RECOVERY,
  CaseStatus.LEFT_OR,
  CaseStatus.IN_POST_OP,
  CaseStatus.READY_FOR_DISCHARGE,
  CaseStatus.DISCHARGED,
]

export const billableStatuses = [
  CaseStatus.INFORMATION_INCOMPLETE,
  CaseStatus.BILLABLE,
  CaseStatus.REVIEWED,
  CaseStatus.BILLED_EXTERNALLY,
  CaseStatus.PARTIALLY_BILLED,
  CaseStatus.BILLED,
]

export const executedStatuses = [
  CaseStatus.DISCHARGED,
  CaseStatus.INFORMATION_INCOMPLETE,
  CaseStatus.BILLABLE,
  CaseStatus.REVIEWED,
  CaseStatus.BILLED_EXTERNALLY,
  CaseStatus.PARTIALLY_BILLED,
  CaseStatus.BILLED,
]

export const statusesWithoutBillingSnapshotUpdate = [
  CaseStatus.REVIEWED,
  CaseStatus.BILLED_EXTERNALLY,
  CaseStatus.PARTIALLY_BILLED,
  CaseStatus.BILLED,
]

export const billedStatuses = [CaseStatus.BILLED, CaseStatus.BILLED_EXTERNALLY]

export const statusesWithupdatableBillingSnapshot = [
  CaseStatus.BILLABLE,
  CaseStatus.INFORMATION_INCOMPLETE,
  CaseStatus.REVIEWED,
  CaseStatus.PARTIALLY_BILLED,
]

export const statusesThatCanViewBillingInfo = [
  CaseStatus.INFORMATION_INCOMPLETE,
  CaseStatus.BILLABLE,
  CaseStatus.REVIEWED,
  CaseStatus.PARTIALLY_BILLED,
  CaseStatus.BILLED_EXTERNALLY,
  CaseStatus.BILLED,
]

export const casesBillingSearchableStatuses = [
  CaseStatus.BILLABLE,
  CaseStatus.BILLED,
  CaseStatus.REVIEWED,
  CaseStatus.PARTIALLY_BILLED,
]

export const casesBillingSearchableOtherStatuses = [
  CaseStatus.DISCHARGED,
  CaseStatus.INFORMATION_INCOMPLETE,
  CaseStatus.BILLED_EXTERNALLY,
]

export const disabledEditCategoryStatuses = [
  CaseStatus.REVIEWED,
  CaseStatus.BILLED_EXTERNALLY,
  CaseStatus.PARTIALLY_BILLED,
  CaseStatus.BILLED,
]

export const checkCategoryStatuses = [CaseStatus.INFORMATION_INCOMPLETE, CaseStatus.BILLABLE]

export enum caseFileSections {
  uploads = 'uploads',
  checkinUploads = 'checkinUploads',
  checkoutUploads = 'checkoutUploads',
  intraOpUploads = 'intraOpUploads',
}

export enum AnesthesiologistPresence {
  AUTO = 'AUTO',
  WITH_ANESTHESIOLOGIST = 'WITH_ANESTHESIOLOGIST',
  NO_ANESTHESIOLOGIST = 'NO_ANESTHESIOLOGIST',
}

export enum CaseFileUploadSections {
  documentsToUpload = 'documentsToUpload',
  checkinDocumentsToUpload = 'checkinDocumentsToUpload',
  checkoutDocumentsToUpload = 'checkoutDocumentsToUpload',
  intraOpDocumentsToUpload = 'intraOpDocumentsToUpload',
}

export const reassegnableRoomStatuses = [
  CaseStatus.PENDING,
  CaseStatus.LOCKED,
  CaseStatus.CHANGE_REQUESTED,
  CaseStatus.ON_HOLD,
  CaseStatus.CHANGE_NOTIFIED,
  CaseStatus.CONFIRMED,
  CaseStatus.PATIENT_ARRIVED,
  CaseStatus.IN_PRE_OP,
  CaseStatus.READY_FOR_ANESTHESIA,
]

export const statusesToExcludeWithConfirmedBooking = [
  CaseStatus.PENDING,
  CaseStatus.LOCKED,
  CaseStatus.CHANGE_REQUESTED,
  CaseStatus.ON_HOLD,
  CaseStatus.CHANGE_NOTIFIED,
]

export const intraOPCaseStatuses = [
  CaseStatus.IN_PRE_OP,
  CaseStatus.READY_FOR_ANESTHESIA,
  CaseStatus.IN_OR,
  CaseStatus.READY_FOR_SURGERY,
  CaseStatus.IN_SURGERY,
  CaseStatus.FINISHED_SURGERY,
  CaseStatus.IN_RECOVERY,
]

export const dayBookingPermissionStatuses = [
  CaseStatus.CONFIRMED,
  CaseStatus.PATIENT_ARRIVED,
  CaseStatus.IN_PRE_OP,
  CaseStatus.READY_FOR_ANESTHESIA,
]

export const fullRescheduleCaseStatuses = [
  CaseStatus.PENDING,
  CaseStatus.LOCKED,
  CaseStatus.CHANGE_REQUESTED,
  CaseStatus.ON_HOLD,
  CaseStatus.CHANGE_NOTIFIED,
  CaseStatus.CONFIRMED,
]

export const limitedRescheduleCaseStatuses = [
  CaseStatus.PATIENT_ARRIVED,
  CaseStatus.IN_PRE_OP,
  CaseStatus.READY_FOR_ANESTHESIA,
]

export const sideBarCaseStatuses = [
  CaseStatus.PENDING,
  CaseStatus.CHANGE_REQUESTED,
  CaseStatus.ON_HOLD,
]

export const checkCanRescheduleCase = (
  caseItem: Case | ILimitedCase,
  {
    canSchedule,
    canScheduleRooms,
    canScheduleDayBookings,
  }: {
    canSchedule?: boolean
    canScheduleRooms?: boolean
    canScheduleDayBookings?: boolean
  }
) => {
  const previousDate = caseItem.bookingSection.date
  const now = new Date()

  if (canScheduleRooms)
    return reassegnableRoomStatuses.includes(caseItem.status)

  if (canScheduleDayBookings)
    return dayBookingPermissionStatuses.includes(caseItem.status) &&
        isSameDay(previousDate, now)

  if (!canSchedule) return false

  if (fullRescheduleCaseStatuses.includes(caseItem.status)) return true

  if (limitedRescheduleCaseStatuses.includes(caseItem.status)) return true

  return false
}

export const checkCanDropCase = (
  caseItem: Case | ILimitedCase,
  {
    canSchedule,
    canScheduleRooms,
    canScheduleDayBookings,
  }: {
    canSchedule?: boolean
    canScheduleRooms?: boolean
    canScheduleDayBookings?: boolean
  },
  newDate: Date,
  newOrId: string
) => {
  const now = new Date()
  const previousDate = caseItem.bookingSection.date
  const isSameRoom = caseItem.operatingRoomId === newOrId

  if (canScheduleRooms && canScheduleDayBookings)
    return reassegnableRoomStatuses.includes(caseItem.status) &&
      (isSameMinute(previousDate, newDate) ||
        (dayBookingPermissionStatuses.includes(caseItem.status) &&
          isSameDay(previousDate, now) &&
          isSameDay(previousDate, newDate)))

  if (canScheduleRooms)
    return reassegnableRoomStatuses.includes(caseItem.status) &&
      isSameMinute(previousDate, newDate)

  if (canScheduleDayBookings)
    return dayBookingPermissionStatuses.includes(caseItem.status) &&
      isSameDay(previousDate, now) &&
      isSameDay(previousDate, newDate) &&
      isSameRoom

  if (!canSchedule) return false

  if (fullRescheduleCaseStatuses.includes(caseItem.status)) return true

  if (limitedRescheduleCaseStatuses.includes(caseItem.status) &&
    ((isSameDay(previousDate, newDate) &&
      isSameDay(now, newDate)) ||
      isSameMinute(previousDate, newDate)
    ))
    return true

  return false
}

export const getCaseNewStatus = (
  caseItem: Case | ILimitedCase,
  {
    canSchedule,
    canScheduleRooms,
    canScheduleDayBookings,
  }: {
    canSchedule?: boolean
    canScheduleRooms?: boolean
    canScheduleDayBookings?: boolean
  },
  newDate?: Date,
) => {
  const now = new Date()
  const previousDate = caseItem.bookingSection.date
  const isInSideBar = sideBarCaseStatuses.includes(caseItem.status)

  if (canScheduleRooms && canScheduleDayBookings)
    return caseItem.status

  if (canScheduleRooms)
    return caseItem.status

  if (canScheduleDayBookings)
    return caseItem.status

  if (!canSchedule) throw new Error('Cannot change date or room') // This should never happen

  if (newDate != null && isSameMinute(newDate, previousDate))
    return isInSideBar ? CaseStatus.CONFIRMED : caseItem.status

  if (newDate != null && isSameDay(newDate, previousDate) && isSameDay(now, newDate))
    return isInSideBar ? CaseStatus.CONFIRMED : caseItem.status

  return CaseStatus.CHANGE_NOTIFIED
}

export enum calendarNotesTypes {
  calendarNotes = 'calendarNotes',
  calendarPreOpNotes = 'calendarPreOpNotes',
  calendarPostOpNotes = 'calendarPostOpNotes',
}

export const calendarNotesSettings = {
  [calendarNotesTypes.calendarNotes]: {
    viewPermission: permissionRequests.canViewCalendarNotes,
    editPermission: permissionRequests.canEditCalendarNotes,
  },
  [calendarNotesTypes.calendarPreOpNotes]: {
    viewPermission: permissionRequests.canViewCalendarPreOpNotes,
    editPermission: permissionRequests.canEditCalendarPreOpNotes
  },
  [calendarNotesTypes.calendarPostOpNotes]: {
    viewPermission: permissionRequests.canViewCalendarPostOpNotes,
    editPermission: permissionRequests.canEditCalendarPostOpNotes
  },
}
