import { Capabilities, PERMISSIONS_DOMAINS_SCOPES, PERMISSION_DOMAINS } from '../enums'
import { AnesthesiologistOpStandard, Identifier, Patient } from './dataModel'
import { IUser } from './users'

export type ICapabilityName = (typeof Capabilities)[keyof typeof Capabilities]
export type ICapabilityKey = keyof typeof Capabilities

export type I_PERMISSION_DOMAINS = (typeof PERMISSION_DOMAINS)[keyof typeof PERMISSION_DOMAINS]

// eslint-disable-next-line max-len
export type I_PERMISSIONS_DOMAINS_SCOPES = (typeof PERMISSIONS_DOMAINS_SCOPES)[keyof typeof PERMISSIONS_DOMAINS_SCOPES]

export type UserPermissions = {
  // eslint-disable-next-line no-unused-vars
  [_key in ICapabilityName]: {
    scope: I_PERMISSIONS_DOMAINS_SCOPES
    users: Identifier[]
  }
}

export interface permissionRequestProps {
  user?: Partial<IUser>
  caseItem?: any // TODO: find a way to add the virtual field caseId into the CaseSchema, it seems to be not supported by mongo
  doctor?: Partial<IUser>
  contract?: any
  anesthesiologistOpStandard?: Partial<AnesthesiologistOpStandard>
  patient?: Partial<Patient>
}

export interface permissionRequestsFunctionProps {
  userPermissions: UserPermissions
  user: IUser
  props: permissionRequestProps
}

export interface IFormattedCapability {
  name?: string
  key?: ICapabilityKey
  permission?: string
  value?: ICapabilityName
  domain: I_PERMISSION_DOMAINS
}
