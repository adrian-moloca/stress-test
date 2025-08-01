import { PipeTransform } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { EditContractDto } from '@smambu/lib.constantsjs'
import { EditContractSchema } from 'src/validations/editContract.validation'

export class EditContractValidatorPipe
implements PipeTransform<EditContractDto> {
  public transform (value: EditContractDto): EditContractDto {
    const result = EditContractSchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new RpcException(errorMessages)
    }
    return value
  }
}
