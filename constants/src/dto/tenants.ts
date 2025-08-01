export interface CreateTenantDTO {
  name: string
  defaultLanguage: 'en' | 'de'
  currencySymbol: '$' | '€'
  resettable: boolean
  exportable: boolean
}

export interface ResetTenantDTO {
  targetTenantId: string
  sourceTenantId?: string
  zipFileId?: string
}

export interface ExportTenantDTO {
  tenantId: string
}

export interface ExportTenantResponse {
  fileId: string
  fileData: any
}
