import { PipeTransform } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { CreateAnesthesiologistOpStandardDto, UpdateAnesthesiologistOpStandardDto } from '@smambu/lib.constantsjs'
import { AnesthesiologistOpStandardSchema } from '../validations/anesthesiologistOpStandard.validation'

export class UpsertAnesthesiologistOpStandardPipe
implements PipeTransform<CreateAnesthesiologistOpStandardDto |
UpdateAnesthesiologistOpStandardDto> {
  public transform (value: CreateAnesthesiologistOpStandardDto |
    UpdateAnesthesiologistOpStandardDto): CreateAnesthesiologistOpStandardDto |
     UpdateAnesthesiologistOpStandardDto {
    const result = AnesthesiologistOpStandardSchema.validate(value)
    if (result.error) {
      const errorMessages = result.error.details.map(d => d.message).join()
      throw new RpcException(errorMessages)
    }
    return value
  }
}
