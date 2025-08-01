import { InvoicePDFArchiveStatus } from '../enums'

export type tInvoicesPdfsArchive = {
  invoicesIds: string[]
  filenames?: string[]
  status: InvoicePDFArchiveStatus
  failReason?: string
  creatorId: string
  generatedAt?: Date
  tenantId: string
}

export type tPDFArchiveGenerationRequest = {
  id: string
  creatorId: string
  tenantId: string
  pdfFilenames: string[]
}

export type tPDFGenerationStats = {
  filename: string
  size: number
}

export type tCheckCaseAccess = {
  canAccessAllCases: boolean
  firstForbiddenCaseId?: string
}

export type tAllEligiblesExportData = {
  invoicesId: string[]
  filenames: string[]
}
