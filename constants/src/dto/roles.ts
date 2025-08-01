import {
  ICapabilityName,
  I_PERMISSIONS_DOMAINS_SCOPES,
  I_PERMISSION_DOMAINS,
} from '../types'

export class CreateRoleDto {
  readonly name!: string
  readonly scope!: I_PERMISSIONS_DOMAINS_SCOPES
  readonly domain_scopes!: {
    [_key in I_PERMISSION_DOMAINS]?: I_PERMISSIONS_DOMAINS_SCOPES
  }

  readonly capabilities!: ICapabilityName[]
}

export class CreateRoleAssociationDto {
  readonly role!: string
  readonly users!: string[]
}

export class UpdateRoleDto {
  readonly id!: string
  readonly data!: CreateRoleDto
}
