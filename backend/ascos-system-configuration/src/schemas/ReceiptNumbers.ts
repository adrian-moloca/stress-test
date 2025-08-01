import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ReceiptNumbersDocument = HydratedDocument<ReceiptNumbers>;

@Schema({ timestamps: true })
export class ReceiptNumbers {
  @Prop({ required: true })
  lastNumber: number

  @Prop()
  tenantId: string
}

export const ReceiptNumbersSchema = generateSchemaWithMiddlewares(ReceiptNumbers)
ReceiptNumbersSchema.index({ lastNumber: 1, tenantId: 1 }, { unique: true })
