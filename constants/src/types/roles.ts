import { ICapabilityName, I_PERMISSIONS_DOMAINS_SCOPES, I_PERMISSION_DOMAINS, TranslatorLanguage } from '../types'
import { Identifier } from './dataModel'

export const a = {}

// TODO: verify -> all domain must be in scopes map
export interface Role {
  tenantId: Identifier
  id: Identifier
  name: string
  capabilities: ICapabilityName[]
  scope: I_PERMISSIONS_DOMAINS_SCOPES
  domain_scopes: {
    [_key in I_PERMISSION_DOMAINS]?: I_PERMISSIONS_DOMAINS_SCOPES
  }
  userCount: number
}

export type IRoles = Record<Identifier, Role>

export type ICreateRoleRequest = Omit<Role, 'id'>

export type IDeleteRoleRequest = Pick<Role, 'id'>

export type IEditRoleRequest = Partial<Role>

export type ICreateRoleAssociationRequest = {
  role: string
  users: string[]
}

// TODO: This is a temporary role association interface until we change the backend to work directly with roles
export interface ISelectedRole {
  roleId: string
  users: string[]
  roleAssociationId: string
}

export type tDynamicCapability = {
  value: string
  domain: I_PERMISSION_DOMAINS
  labels: Record<TranslatorLanguage, string>
}
