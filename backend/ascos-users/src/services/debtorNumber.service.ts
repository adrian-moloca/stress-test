import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { DebtorNumber, DebtorNumberDocument, DEBTOR_NUMBER_SEQUENCE_ID } from 'src/schemas/debtorNumber.schema'

const fieldNameOf = <T>(name: keyof T) => {
  return name
}

@Injectable()
export class DebtorNumberService {
  constructor (
    @InjectModel(DebtorNumber.name) private debtorNumberModel: Model<DebtorNumberDocument>,
  ) {}

  // TODO: we will need the full logic
  async getNext (): Promise<number> {
    const val = await this.debtorNumberModel.findOneAndUpdate(
      { _id: DEBTOR_NUMBER_SEQUENCE_ID },
      { $inc: { [fieldNameOf<DebtorNumber>('sequence_value')]: 1 } },
      {
        new: true,
        upsert: true
      }
    )

    return val.sequence_value
  }
}
