import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { TTenantDataFile } from '@smambu/lib.constantsjs'

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true })
export class Tenant {
  @Prop()
  name: string

  @Prop()
  resettable: boolean

  @Prop()
  isResetting: boolean

  @Prop()
  exportable: boolean

  @Prop()
  isExporting: boolean

  @Prop()
  dataFiles: TTenantDataFile[]
}

export const TenantSchema = SchemaFactory.createForClass(Tenant)

TenantSchema.virtual('tenantId').get(function () {
  return this._id.toHexString()
})

TenantSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    return ret
  },
})
