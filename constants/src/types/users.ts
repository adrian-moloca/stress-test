import { Identifier } from './dataModel'
import { NaiveDate } from './global'
import { Role } from './roles'

export interface IAddress {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export interface RoleAssociation {
  tenantId: string
  id: string
  role: Identifier
  users: Identifier[]
}

export interface IUser {
  id: string
  _id: string
  title: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  birthDate: Date | null
  address: IAddress
  roleAssociations: RoleAssociation[]
  createdAt: Date
  updatedAt: Date
  tenantId: string
  active: boolean
  activatedAt?: Date | null
  roles?: Role[]
  debtorNumber: string
  isDoctor?: boolean
  practiceName?: string
  verified?: boolean
}

export interface ICredential {
  id: string
  _id: string
  email: string
  password: string
  verified: boolean
  verifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
  isSuperAdmin: boolean
  pendingResetToken?: string
}

export interface IGetCredentialDataResponse {
  email: string
  verified: boolean
}

export type IUsers = Record<IUser['id'], IUser>

export interface ICreateUserRequest {
  title: string
  firstName: string
  lastName: string
  birthDate?: string
  phoneNumber: string
  email: string
  address: IAddress
  roleAssociations: string[]
}

export interface ISerializedUser {
  id: string
  _id: string
  title: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  birthDate: NaiveDate
  address: IAddress
  active: boolean
  roleAssociations: RoleAssociation[]
  createdAt: Date
  updatedAt: Date
  roles?: Role[]
  debtorNumber: string
  tenantId: string
}

export interface IGetUsersQuery {
  search?: string
}
