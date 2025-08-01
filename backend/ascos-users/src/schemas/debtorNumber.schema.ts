import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'

export type DebtorNumberDocument = DebtorNumber & Document;

export const DEBTOR_NUMBER_SEQUENCE_ID: string = 'sequence_number'

@Schema()
export class DebtorNumber {
  @Prop({
    type: String,
    default: () => `${DEBTOR_NUMBER_SEQUENCE_ID}`,
    required: true,
  })
  _id: string

  @Prop({ default: 0 })
  sequence_value: number

  @Prop()
  tenantId: string
}

export const DebtorNumberSchema = generateSchemaWithMiddlewares(DebtorNumber)

DebtorNumberSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.DEBTOR_NUMBER
})
