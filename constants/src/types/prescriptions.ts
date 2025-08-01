import { IDebtor, ISammelCheckpoint } from './billing'
import { Case } from './cases'
import { Identifier, Patient } from './dataModel'
import { IPcMaterial } from './pcMaterials'

export enum EPrescriptionStatus {
  EMITTED = 'EMITTED',
  CANCELLED = 'CANCELLED',
  PRESCRIBED = 'PRESCRIBED',
}

export interface PrescriptionsFullTextQueryDto {
  query: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  datePattern: string
  fromTimestamp?: string
  toTimestamp?: string
  casesIds?: string[]
}

export interface IPaginatedInvoiceResponse {
  results: IPrescription[]
  total: number
  currentPage: number
  limit: number
}

export interface IGeneratePrescriptionsDTO {
  pcMaterialsIds?: string[],
  prescriptionsToRefundIds?: string[],
  isCancellation: boolean,
}

export interface IGeneratePrescriptionJob {
  userId: string,
  tenantId: string,
  prescriptionSnapshotRef: string,
  isCancellation: boolean,
}

export interface IPrescription {
  _id: Identifier
  prescriptionNumber: string
  creatorId: string
  debtor: IDebtor
  patients?: {
    name: Patient['name']
    surname: Patient['surname']
    birthDate: Patient['birthDate']
    patientId: Patient['patientId']
  }[]
  casesRef: string[]
  status: EPrescriptionStatus
  pcMaterialsRef: string[]
  doctorsIds: string[]
  sammelCheckpointRef?: string
  tenantId?: string
  createdAt: Date
}

export interface IHydratedPrescription extends IPrescription {
  cases: Case[],
  sammelCheckpoint?: ISammelCheckpoint
  pcMaterials: IPcMaterial[]
}

export interface PaginatedPrescriptionsResponse {
  results: IHydratedPrescription[]
  total: number
  currentPage: number
  limit: number
}

export interface IPrescriptionSnapshot {
  createdAt: Date
  updatedAt: Date
  cases: Case[]
  pcMaterials: IPcMaterial[]
  sammelCheckpoint?: ISammelCheckpoint
  prescriptionToRefund?: IPrescription
  isCancellation: boolean
  tenantId: string
}
