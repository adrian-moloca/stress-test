import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { systemConfigurationSections } from '@smambu/lib.constantsjs'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

export type SystemConfigurationDataDocument = SystemConfigurationData & Document

@Schema({ timestamps: true })
export class SystemConfigurationData {
  @Prop({
    type: String,
    default: () => `sysConfig_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop()
  section: systemConfigurationSections

  @Prop({
    type: Object,
  })
  data: any

  @Prop()
  tenantId: string
}

export const SystemConfigurationDataSchema = generateSchemaWithMiddlewares(SystemConfigurationData)
