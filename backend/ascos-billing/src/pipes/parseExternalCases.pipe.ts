import { IMarkAsExternalDTO } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class ParseExternalCases implements PipeTransform<IMarkAsExternalDTO, string[]> {
  transform (value: IMarkAsExternalDTO): string[] {
    return value?.cases ?? []
  }
}
