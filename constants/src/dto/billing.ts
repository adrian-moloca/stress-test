import { BillsListCSVExport } from '../enums'
import { IGeneratedInvoices, IHidratedGeneratedInvoices } from '../types'

export interface IGetBillDTO {
  billId?: string
  name?: string
  createdAt?: string
  updatedAt?: string
  deleted?: string
}

export interface ICreateBillDTO {
  billId: string
  caseId: string
  tenantId: string
}

export interface ISingleExtraMaterialDTO {
  materialId: string
  editedPrice: string
  amount: string
}

export interface ISingleExtraCustomCostDTO {
  costId: string
  name: string
  price: string
  description?: string
}

export interface IExtraMaterialsDTO {
  materials: ISingleExtraMaterialDTO[]
}

export interface IExtraCustomCostsDTO {
  customCosts: ISingleExtraCustomCostDTO[]
}

export interface IMarkAsExternalDTO {
  cases: string[]
}
export interface IGenerateBillsRequestDTO {
  payload: Omit<IGeneratedInvoices, 'invoiceId'>[]
}

export interface IRequestPDFArchiveGenerationDTO {
  payload: string[]
}

export interface ICancelPayloadItem {
  cases: string[]
  billObjsIds: string[]
}

export interface ICancelBillsRequestDTO {
  payload: ICancelPayloadItem[]
}

export interface InvoiceFullTextQueryDto {
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

export interface PaginatedInvoiceResponse {
  results: IHidratedGeneratedInvoices[]
  total: number
  currentPage: number
  limit: number
}

export interface ExportCsvRequestDTO {
  exportType: BillsListCSVExport
  datePattern: string
  selectedIds?: string[]
  fromTimestamp?: string
  toTimestamp?: string
  query?: string
}

export interface GetSammelCheckpointPreviewDTO {
  caseId: string
  doctorId: string
  isCancellation: boolean
}
