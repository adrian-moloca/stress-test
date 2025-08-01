import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type CaseBillingDocument = HydratedDocument<CaseBilling>;

@Schema({ timestamps: true })
export class CaseBilling {
  @Prop()
  billId: string

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop({ unique: true })
  caseId: string

  @Prop({ type: String, ref: 'Snapshot' })
  snapshot: string

  @Prop({ type: Array<String>, ref: 'BillsObj' })
  bills: string[]

  @Prop({ type: Array<String> })
  missingData: string[]

  @Prop({ type: Array<String> })
  missingItems: string[]

  @Prop()
  tenantId: string
}

export const CaseBillingSchema = generateSchemaWithMiddlewares(CaseBilling)

CaseBillingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
