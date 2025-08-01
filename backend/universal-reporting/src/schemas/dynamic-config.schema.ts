import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

@Schema({ timestamps: true })
export class DynamicDataConfig {
  @Prop({ type: Object })
  // TODO: ref #1155, we can try to type this better when the general structure of the dynamic
  // data will be finalized
  data: unknown

  @Prop({ unique: true })
  versionRef: string

  @Prop()
  tenantId: string
}
export type DynamicDataConfigDocument = HydratedDocument<DynamicDataConfig>;

export const DynamicDataConfigSchema = generateSchemaWithMiddlewares(DynamicDataConfig)

DynamicDataConfigSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.DYNAMIC_DATA_CONFIG })

DynamicDataConfigSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
