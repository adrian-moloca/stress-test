import { ETenantDatabases, ETenantJobTypes } from '../enums'

export type ITenant = {
  tenantId: string
  name: string
  resettable: boolean
  isResetting: boolean
  exportable: boolean
  isExporting: boolean
  dataFiles: TTenantDataFile[]
}

export type TTenantDataFile = {
  zipFileId: string
  createdAt: Date
}

export type TTenantData = {
  [ETenantDatabases.ANAGRAPHICS]: any
  [ETenantDatabases.BILLING]: any
  [ETenantDatabases.BUCKET]: any
  [ETenantDatabases.CONTRACTS]: any
  [ETenantDatabases.LOGS]: any
  [ETenantDatabases.NOTIFICATIONS]: any
  [ETenantDatabases.OR_MANAGEMENT]: any
  [ETenantDatabases.PATIENTS]: any
  [ETenantDatabases.ROLES]: any
  [ETenantDatabases.CASES]: any
  [ETenantDatabases.SYSTEM_CONFIGURATIONS]: any
  [ETenantDatabases.USERS]: any
}

export type TTenantJob = {
  type: ETenantJobTypes
  targetTenantId: string
  sourceTenantId?: string
  zipFileId?: string
}
