import { PipeTransform } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { CreateRoleAssociationDto } from '@smambu/lib.constantsjs'
import { CreateRoleAssociationSchema } from '../validations'

export class CreateRoleAssociationPipe
implements PipeTransform<CreateRoleAssociationDto> {
  public transform (value: CreateRoleAssociationDto): CreateRoleAssociationDto {
    const result = CreateRoleAssociationSchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new RpcException(errorMessages)
    }
    return value
  }
}
