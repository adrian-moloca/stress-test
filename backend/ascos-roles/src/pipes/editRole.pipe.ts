import { PipeTransform } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { UpdateRoleDto } from '@smambu/lib.constantsjs'
import { EditRoleSchema } from '../validations'

export class EditRoleValidatorPipe implements PipeTransform<UpdateRoleDto> {
  public transform (value: UpdateRoleDto): UpdateRoleDto {
    const result = EditRoleSchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new RpcException(errorMessages)
    }
    return value
  }
}
