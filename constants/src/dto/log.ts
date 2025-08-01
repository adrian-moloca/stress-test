import { AuditAction, Component, EntityType, Level } from '../enums'
import { IAnagraphicSetup } from '../types/anagraphics'

export class CreateLogDto {
  readonly component?: Component
  readonly level?: Level
  readonly message?: string
}

export class QueryLogDto {
  readonly search?: string
  readonly from?: string | number
  readonly to?: string | number
  readonly component?: Component
  readonly level?: Level
  readonly sortBy?: 'timestamp' | 'component' | 'level' | 'message'
  readonly sortOrder?: 'desc' | 'asc'
  readonly limit?: number
  readonly page?: number
}

export class SaveAuditTrailDto {
  readonly userId?: string
  readonly entityType?: EntityType
  readonly entityNameOrId?: string
  readonly entityDatabaseId?: string
  readonly action?: AuditAction
  readonly prevObj?: any
  readonly newObj?: any
  readonly anagraphicSetup?: IAnagraphicSetup
}

export class QueryAuditTrailDto {
  readonly search?: string
  readonly from?: string | number
  readonly to?: string | number
  readonly userId?: string
  readonly action?: AuditAction
  readonly sortBy?:
    | 'timestamp'
    | 'userDatabaseId'
    | 'userName'
    | 'entityType'
    | 'entityName'
    | 'databaseId'
    | 'field'
    | 'action'
    | 'previousValue'
    | 'newValue'

  readonly sortOrder?: 'desc' | 'asc'
  readonly limit?: number
  readonly page?: number
}
