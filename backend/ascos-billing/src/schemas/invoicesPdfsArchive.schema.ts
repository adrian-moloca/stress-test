import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { InvoicePDFArchiveStatus } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type InvoicesPdfsArchiveDocument = HydratedDocument<InvoicesPdfsArchive>;

@Schema({ timestamps: true })
export class InvoicesPdfsArchive {
  // maybe use invoices ids?
  // ref verso gli id da generare direi
  @Prop()
  invoicesIds: string[]

  @Prop()
  filenames: string[] | undefined

  @Prop()
  status: InvoicePDFArchiveStatus

  @Prop()
  failReason: string | undefined

  @Prop()
  creatorId: string

  @Prop()
  generatedAt: Date | undefined

  @Prop()
  tenantId: string
}

export const InvoicesPdfsArchiveSchema = generateSchemaWithMiddlewares(InvoicesPdfsArchive)

InvoicesPdfsArchiveSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
