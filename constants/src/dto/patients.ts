import { Gender_Name, InsuranceStatus } from '../enums'
import { Address, Identifier, NaiveDate } from '../types'

export interface SerializedPatient {
  tenantId: Identifier
  patientId: Identifier
  patientNumber: string
  debtorNumber: string
  title?: string
  name: string
  surname: string
  birthDate: NaiveDate | null
  cardInsuranceNumber?: string // Only if insuranceStatus is not InsuranceStatus.NONE
  germanInsuranceId?: Identifier // Only if insuranceStatus is not InsuranceStatus.NONE
  insuranceVersionId: Identifier
  germanInsuranceStatus: InsuranceStatus
  gender: Gender_Name
  genderSpecifics?: string // Only if gender is Gender_Name.OTHER
  genderBirth: Gender_Name
  nationality: string
  phoneNumber: string
  email: string
  address: Address
  doctorsIds: Identifier[]
}
export interface GetPatientsDto {
  cardInsuranceNumber?: string
  name?: string
  surname?: string
  birthDate?: string
  address?: Address
}

export interface fullTextQueryDto {
  query: string
  page: number
  limit: number
  sortBy?: 'patientNumber' | 'name' | 'surname' | 'birthDate' | 'cardInsuranceNumber'
  sortOrder: 'desc' | 'asc'
  datePattern: string
}

export interface PaginatedPatientsResponse {
  results: SerializedPatient[]
  total: number
  currentPage: number
  limit: number
}
