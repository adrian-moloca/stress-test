import { ICancelBillsRequestDTO, ICancelPayloadItem } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class ParseCancelBillsRequest implements PipeTransform<ICancelBillsRequestDTO,
  ICancelPayloadItem[]> {
  transform (value: ICancelBillsRequestDTO): ICancelPayloadItem[] {
    return value.payload
  }
}
