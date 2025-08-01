import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import { AuditAction } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

export type AuditTrailDocument = HydratedDocument<AuditTrail>

@Schema({ timestamps: true })
export class AuditTrail {
  @Prop({
    type: String,
    default: () => `audit_trail_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({ type: String })
  userId: string

  @Prop({ type: String })
  entityType: string

  @Prop({ type: String })
  entityNameOrId: string

  @Prop({ type: String })
  entityDatabaseId: string

  @Prop({ type: String })
  action: AuditAction

  @Prop({ type: Object })
  previousValue: any

  @Prop({ type: Object })
  newValue: any

  @Prop({ type: String })
  field: string

  @Prop({ type: Number })
  version: number

  @Prop({ type: Boolean })
  bulked: boolean

  @Prop()
  tenantId: string
}

export const AuditTrailSchema = generateSchemaWithMiddlewares(AuditTrail)
AuditTrailSchema.index({
  createdAt: 1,
})

AuditTrailSchema.index({
  field: 'text',
})

AuditTrailSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})

AuditTrailSchema.index({ tenantId: 1, userId: 1, version: 1, createdAt: -1 })
