import { lockWeekDto } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class ParseLockWeek implements PipeTransform<lockWeekDto, lockWeekDto> {
  transform (value: lockWeekDto): lockWeekDto {
    const parsedValue = {
      ...value,
    }
    return parsedValue
  }
}
