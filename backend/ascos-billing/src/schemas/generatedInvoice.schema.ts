import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { IDebtor, InvoiceStatus, InvoiceType, Patient, RecipientType } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type GeneratedInvoiceDocument = HydratedDocument<GeneratedInvoice>;

@Schema({ timestamps: true })
export class GeneratedInvoice {
  @Prop()
  invoiceId: string

  @Prop()
  invoiceNumber: string

  @Prop()
  creatorId: string

  @Prop()
  generatedAt: Date

  @Prop({ type: Object })
  recipient: RecipientType

  @Prop({ type: Object })
  debtor: IDebtor

  @Prop({ type: Object })
  patients?: Patient[]

  @Prop()
  originalInvoiceId?: string

  @Prop()
  originalInvoiceNumber?: string

  @Prop()
  originalInvoiceType?: InvoiceType

  @Prop({ type: Object })
  casesRef: string[]

  @Prop({ type: Object })
  type: InvoiceType

  @Prop()
  status: InvoiceStatus

  @Prop({ type: Array<String>, ref: 'IBillObj' })
  billObjRefs: string[]

  @Prop()
  dueDate: Date

  @Prop()
  total: number

  @Prop()
  totalOwed: number

  @Prop()
  pdfRef?: string

  @Prop()
  sammelCheckpointRef?: string

  @Prop()
  doctorsIds: string[]

  @Prop()
  paid: boolean

  @Prop()
  tenantId: string

  @Prop()
  posted: boolean
}

export const GeneratedInvoiceSchema = generateSchemaWithMiddlewares(GeneratedInvoice)

GeneratedInvoiceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
