import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

@Schema({ timestamps: true })
export class JsonConfig {
  @Prop({ type: Object })
  // TODO:  ref #1155, we can try to type this better when the general structure of the billing
  // config will be finalized
  data: unknown

  @Prop({ unique: true, required: true })
  version: string

  @Prop()
  tenantId: string
}

export type JsonConfigDocument = HydratedDocument<JsonConfig>;

export const JSonConfigSchema = generateSchemaWithMiddlewares(JsonConfig)

JSonConfigSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.BILLING_CONFIG })

JSonConfigSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
