import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import {
  ICasePosition, IDebtor, IExtraCustomCosts, IExtraMaterial, InvoiceStatus,
  InvoiceType, Patient, RecipientType
} from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type BillsObjDocument = HydratedDocument<BillsObj>;

@Schema({ timestamps: true })
export class BillsObj {
  @Prop()
  billObjId: string

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  type: InvoiceType

  @Prop()
  status: InvoiceStatus

  @Prop()
  recipient: RecipientType

  @Prop()
  dueDate: Date

  @Prop()
  totalSum: number

  @Prop()
  totalOwed: number

  @Prop()
  external: boolean

  @Prop({ type: Object })
  debtor: IDebtor

  @Prop({ type: Object })
  patient: Patient

  @Prop({ type: Object })
  extraMaterials: IExtraMaterial[]

  @Prop({ type: Object })
  extraCustomCosts: IExtraCustomCosts[]

  @Prop({ type: Object })
  positions: ICasePosition[]

  @Prop({ type: Array<String> })
  missingData: string[]

  @Prop({ type: Array<String> })
  missingItems: string[]

  @Prop()
  elaborationInProgress: boolean

  @Prop()
  caseId: string

  @Prop()
  tenantId: string
}

export const BillsObjSchema = generateSchemaWithMiddlewares(BillsObj)

BillsObjSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})

BillsObjSchema.index({ tenantId: 1, billObjId: 1 })
