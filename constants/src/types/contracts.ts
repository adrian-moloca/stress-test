import { ContractStatus } from '../enums'

export type tContractsFilters = {
  validFrom: Date | number | null
  validUntil: Date | number | null
  search: string
  status: ContractStatus
  doctorId: string | undefined
  page: number
  limit: number
  sortModel: { field: string; sort: 'asc' | 'desc' | null | undefined }[]
}
