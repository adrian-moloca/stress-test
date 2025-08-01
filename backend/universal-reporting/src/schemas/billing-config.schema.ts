import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

@Schema({ timestamps: true })
export class BillingConfig {
  @Prop({ type: Object })
  // TODO: maybe this better in the future, when the config type
  // will be well known and tested
  data: unknown

  @Prop({ unique: true })
  versionRef: string

  @Prop()
  tenantId: string
}

export type BillingConfigDocument = HydratedDocument<BillingConfig>;

export const BillingConfigSchema = generateSchemaWithMiddlewares(BillingConfig)

BillingConfigSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.BILLING_CONFIG })

BillingConfigSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
