import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

export type SurgerySlotDocument = HydratedDocument<SurgerySlot>;

@Schema({ timestamps: true })
export class SurgerySlot {
  @Prop({
    type: String,
    default: () => `surgerySlot_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({
    type: String,
    ref: 'Contract',
    required: true,
  })
  contractId: string

  @Prop({
    required: true,
  })
  from: Date

  @Prop({
    required: true,
  })
  to: Date

  @Prop()
  tenantId: string
}

export const SurgerySlotSchema = generateSchemaWithMiddlewares(SurgerySlot)

// TODO: add this when the insert many problem is resolved
// the problem is the following: since every time a surgery slot is changed
// the entire array gets deleted and recreated (with an insertmany), there is no
// way to block this in the middleware and the insertmany will then produce
// thousands of events.
// SurgerySlotSchema.plugin(localEventsPlugin, {source: SOURCE_SCHEMAS.SURGERY_SLOTS})

SurgerySlotSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})

SurgerySlotSchema.index({ contractId: 1, tenantId: 1 })
