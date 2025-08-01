import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { tDynamicAnagraphicSetup } from '@smambu/lib.constantsjs'

export type DynamicAnagraphicsSetupsDocument = DynamicAnagraphicsSetups & Document

@Schema({ timestamps: true })
export class DynamicAnagraphicsSetups {
  @Prop({
    type: String,
    required: true,
  })
  tenantId: string

  @Prop({
    type: [Object],
    required: true,
  })
  setups: tDynamicAnagraphicSetup[]

  @Prop({
    type: String,
    required: true,
  })
  version: string
}

export const DynamicAnagraphicsSetupsSchema =
  generateSchemaWithMiddlewares(DynamicAnagraphicsSetups)
