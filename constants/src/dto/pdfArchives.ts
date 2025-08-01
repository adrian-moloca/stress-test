import { InvoiceType } from '../enums'
import { tInvoicesPdfsArchive } from '../types'

export interface IGetPDFArchivesDTO {
  page: number
  pageSize: number
}

export interface PaginatedPDFArchivesResponse {
  results: tInvoicesPdfsArchive[]
  total: number
  currentPage: number
  limit: number
}

export interface ArchiveAllEligiblesDTO {
  datePattern: string
  fromTimestamp?: number
  toTimestamp?: number
  query?: string
  invoiceTypes?: InvoiceType[]
}
