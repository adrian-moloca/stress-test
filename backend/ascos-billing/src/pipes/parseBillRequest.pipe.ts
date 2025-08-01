import { IBillObj, ICaseBilling, ICreateBillDTO } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class ParseCreateBill implements PipeTransform<ICreateBillDTO, ICaseBilling> {
  transform (value: ICreateBillDTO): ICaseBilling {
    const createdAt = new Date()
    const updatedAt = new Date()
    const deleted = false
    const bills: IBillObj[] = []

    const parsedValue = {
      ...value,
      createdAt,
      updatedAt,
      deleted,
      snapshot: null,
      bills
    }

    return parsedValue
  }
}
