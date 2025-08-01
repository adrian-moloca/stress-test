import { PipeTransform } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { CreateContractDto } from '@smambu/lib.constantsjs'
import { CreateContractSchema } from '../validations'

export class CreateContractValidatorPipe
implements PipeTransform<CreateContractDto> {
  public transform (value: CreateContractDto) {
    const result = CreateContractSchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new RpcException(errorMessages)
    }
    return value
  }
}
