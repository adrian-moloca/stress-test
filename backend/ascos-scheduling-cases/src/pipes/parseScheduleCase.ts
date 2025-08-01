import { scheduleCaseDTO } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
import { isValid } from 'date-fns'
@Injectable()
export class ParseScheduleCase implements PipeTransform<scheduleCaseDTO, scheduleCaseDTO> {
  transform (value: scheduleCaseDTO): scheduleCaseDTO {
    const parsedValue = {
      ...value,
    }

    const parsedDate = new Date(parsedValue.newDate)
    parsedValue.newDate = isValid(parsedDate) ? parsedDate : null

    return parsedValue
  }
}
