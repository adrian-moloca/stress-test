import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { ICaseBillingSnapshot, InvoiceType } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { BillsObjDocument } from './billsObj.schema'

export type InvoicesCasesSnapshotDocument = HydratedDocument<InvoicesCasesSnapshot>;

@Schema({ timestamps: true })
export class InvoicesCasesSnapshot {
  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop({ type: Object })
  snapshot: ICaseBillingSnapshot

  @Prop()
  billObjs: BillsObjDocument[]

  @Prop()
  invoiceId: string

  @Prop()
  invoiceType: InvoiceType

  @Prop()
  tenantId: string
}

export const InvoicesCasesSnapshotSchema = generateSchemaWithMiddlewares(InvoicesCasesSnapshot)

InvoicesCasesSnapshotSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})

InvoicesCasesSnapshotSchema.index({ tenantId: 1, invoiceId: 1 })
