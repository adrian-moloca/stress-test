import { AuditAction, EntityType } from '../enums'

export interface IAuditTrailRow {
  tenantId: string
  _id: string
  userId: string
  entytyType: EntityType
  entityNameOrId: string
  entityDatabaseId: string
  action: AuditAction
  previousValue: string
  field: string
  newValue: string
  createAt: string
  updatedAt: string
}

export type tLogRow = {
  _id: string
  component: string
  level: string
  message: string
  createdAt: Date
  updatedAt: Date
  tenantId: string
}
