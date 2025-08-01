import { CaseFileUploadSections, CaseStatus, caseFileSections } from '../enums'
import { CaseFileToDelete, CaseForm, EPcMaterialsStatus } from '../types'
import { SerializedPatient } from './patients'

export interface CaseFormDTO extends Omit<CaseForm, 'bookingPatient'> {
  bookingPatient: SerializedPatient
}

export interface UpdateCaseDTO {
  caseData: CaseFormDTO
  changedFields: string[]
  acceptedConflicts: string[]
  caseLoadedAtTS: string
}

export interface CloseCaseDTO {
  caseId: string
}

export interface UpdateCasePayload {
  caseData: CaseForm
  changedFields: string[]
  acceptedConflicts: string[]
  caseLoadedAtTS: Date
}

export interface QueryCasesDto {
  fromTimestamp?: string
  toTimestamp?: string
  patientId?: string
  statuses?: CaseStatus[]
  search?: string
  page?: number
  limit?: number
  datePattern: string
  sortBy?: string | null
  sortOrder?: string | null
  doctorId?: string
  missingFieldsFilter?: string[]
  missingInfoFilter?: string[]
  limitedCases?: boolean
  hideClosedCases?: boolean
  pcMaterialsStatuses?: EPcMaterialsStatus[]
}

export interface scheduleCaseDTO {
  caseId: string
  newOrId?: string
  newStatus: string
  newDate?: Date
  withoutBackup?: boolean
  confirmationNote?: string
}

export interface lockWeekDto {
  formattedDate: string
}

export interface lockWeekResponseDto {
  lockedWeekTimestamp: number
}

export interface updateAnesthesiologistsDto {
  anesthesiologistsId: string[]
}

export interface updateMultipleCasesAnesthesiologistsDto {
  [caseId: string]: string[]
}
export interface associatePatientDto {
  caseId: string
  patientId: string
}
export interface deleteCaseFilesDto {
  filesToDelete: CaseFileToDelete[]
  caseId: string
}

export interface uploadFilesDto {
  documentsToUpload: File[]
  fileSection: caseFileSections
}

export interface UpdateCaseResponse {
  updated: boolean
  conflictingFields: string[]
  caseData: CaseForm | null
}

export type tCaseFileSections = keyof typeof CaseFileUploadSections
