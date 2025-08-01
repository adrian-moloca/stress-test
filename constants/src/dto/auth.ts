import { BadRequestException } from '@nestjs/common'
import { IUser, TranslatorLanguage } from '../types'
import { ITenant } from '../types/tenants'

export class LoginToTenantRequestDto {
  tenantId!: string
  email!: string
}

export class LoginToTenantResponseDto {
  email!: string
  user!: IUser
  tokenWithTenant!: string
  tenant!: ITenant
}

export class LoginRequestDto {
  email!: string
  password!: string
}

export class LoginResponseDto {
  email!: string
  users!: IUser[]
  tenants!: ITenant[]
  tokenWithoutTenant!: string
  isSuperAdmin!: boolean
}

export interface ValidationError {
  [key: string]: ValidationError | string[]
}

export class ValidationException extends BadRequestException {
  constructor (public validationErrors: ValidationError) {
    super()
  }
}

export class ErrorDto {
  message!: string
  errors!: ValidationError
}

export class ResetPasswordRequestDto {
  password!: string
  token!: string
}

export class SendVerificationEmailRequestDto {
  email!: string
  language!: TranslatorLanguage
}
