import { PipeTransform, BadRequestException } from '@nestjs/common'

import {
  CreateUserDto,
  EditUserDto,
  GetUsersQueryDto,
  GetUsersQuerySchema,
} from '@smambu/lib.constantsjs'
import { toDate } from 'date-fns-tz'
export interface CreateUserPayload {
  firstname?: string
  lastname?: string
  isVerified?: boolean
  email?: string
  phoneNumber?: number
  roleAssociations?: string[]
  birthDate?: Date | null
}

export interface EditUserPayload {
  firstName?: string
  lastName?: string
  isVerified?: boolean
  email?: string
  phoneNumber?: number
  roleAssociations?: string[]
  active?: boolean
  birthDate?: Date | null
}

export class CreateUserValidatorPipe implements PipeTransform<CreateUserDto, CreateUserPayload> {
  public transform (value: CreateUserDto): CreateUserPayload {
    const payload: CreateUserPayload = {
      ...value,
      birthDate: null,
    }
    if (value.birthDate)
      payload.birthDate = toDate(value.birthDate, {
        timeZone: 'UTC',
      })

    return payload
  }
}

export class EditUserValidatorPipe implements PipeTransform<CreateUserDto, EditUserPayload> {
  public transform (value: EditUserDto): EditUserPayload {
    const payload: EditUserPayload = {
      ...value,
      birthDate: null,
    }
    if (value.birthDate)
      payload.birthDate = toDate(value.birthDate, {
        timeZone: 'UTC',
      })

    return payload
  }
}

export class GetUsersQueryValidatorPipe
implements PipeTransform<GetUsersQueryDto> {
  public transform (value: GetUsersQueryDto): GetUsersQueryDto {
    const result = GetUsersQuerySchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new BadRequestException(errorMessages)
    }
    return value
  }
}
