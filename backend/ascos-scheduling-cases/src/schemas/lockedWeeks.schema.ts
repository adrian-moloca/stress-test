import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
export type LockedWeekDocument = HydratedDocument<LockedWeek>;

@Schema({ timestamps: true })
export class LockedWeek {
  @Prop()
  timeStamp: Number

  @Prop()
  saveDateTimestamp: Number

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string
}

export const LockedWeekSchema = generateSchemaWithMiddlewares(LockedWeek)

LockedWeekSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.LOCKED_WEEKS })

LockedWeekSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
