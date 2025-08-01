import { PipeTransform } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { CreateRoleDto } from '@smambu/lib.constantsjs'
import { CreateRoleSchema } from '../validations'

export class CreateRoleValidatorPipe implements PipeTransform<CreateRoleDto> {
  public transform (value: CreateRoleDto): CreateRoleDto {
    const result = CreateRoleSchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new RpcException(errorMessages)
    }
    return value
  }
}
