import { Identifier, Patient } from './dataModel'

interface IDebtor {
  title?: string
  firstName?: string
  lastName?: string
  street?: string
  houseNumber?: string
  postalCode?: string
  city?: string
  country?: string
  debtorNumber?: string
  practiceName?: string
  isDoctor?: boolean
}

export enum EPcMaterialsStatus {
  INFORMATION_INCOMPLETE = 'INFORMATION_INCOMPLETE',
  NOT_READY = 'NOT_READY',
  READY = 'READY',
  PROCESSED = 'PROCESSED',
}

export const pcMaterialsStatus = [
  EPcMaterialsStatus.INFORMATION_INCOMPLETE,
  EPcMaterialsStatus.NOT_READY,
  EPcMaterialsStatus.READY,
  EPcMaterialsStatus.PROCESSED,
]

export interface IPcMaterialsPosition {
  date: Date
  abbreviation?: string
  description: string
  amount: number
  price: number
  priceTotal: number
  materialId?: string
  supplierNumber?: string
  vatPosition?: boolean
  unitOfMeasure: string
  pzn: number | string
  sammelFactor: number
  itemCode: string
  sammelCategory: string
  supplier: string
}

export interface IPcMaterial {
  _id: Identifier
  caseId: string
  status: EPcMaterialsStatus
  debtor: IDebtor
  patient: Partial<Patient>
  positions: IPcMaterialsPosition[]
  missingData: string[]
  missingItems: string[]
  tenantId?: string
  elaborationInProgress: boolean
  reviewed: boolean
  cancelled: boolean
}

export interface IPcMaterialsCasesFilters {
  statusFilters: EPcMaterialsStatus[]
  selectedDoctorId: string
  startDate: Date | null
  endDate: Date | null
  page: number
  limit: number
  sortModel: { field: string; sort: 'desc' | 'asc' | null | undefined }[]
}

export interface PrescriptionsPcMaterialsRequestDTO {
  fromTimestamp?: string
  toTimestamp?: string
  patientId?: string
  page?: number
  limit?: number
  sortBy?: string | null
  sortOrder?: string | null
  doctorId: string
  datePattern: string
}
