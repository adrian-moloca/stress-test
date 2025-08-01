import { PipeTransform } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { CreateTenantDTO } from '@smambu/lib.constantsjs'
import CreateTenantSchema from '../validations/CreateTenantSchema'

export class CreateTenantBodyValidator
implements PipeTransform<CreateTenantDTO> {
  public transform (value: CreateTenantDTO) {
    const result = CreateTenantSchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new RpcException(errorMessages)
    }
    return value
  }
}
