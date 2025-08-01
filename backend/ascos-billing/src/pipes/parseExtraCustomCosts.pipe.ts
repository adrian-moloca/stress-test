import { IExtraCustomCosts, IExtraCustomCostsDTO } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class ParseExtraCustomCosts implements PipeTransform<IExtraCustomCostsDTO,
  IExtraCustomCosts[]> {
  transform (value: IExtraCustomCostsDTO): IExtraCustomCosts[] {
    return value.customCosts.map(customCost => {
      const price = Number(customCost.price)

      return ({
        ...customCost,
        price
      }
      )
    })
  }
}
