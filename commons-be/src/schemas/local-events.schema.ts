import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { tLocalEventValue, tLocalEventsMetadata, tSourceSchemaValues } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares } from '../middlewares'

export type LocalEventsDocument = HydratedDocument<LocalEvents>;

@Schema({ timestamps: true })
export class LocalEvents {
  @Prop({ type: String })
  source!: tSourceSchemaValues

  @Prop({ type: Types.ObjectId })
  sourceDocId!: string

  @Prop({ default: false })
  ready!: boolean

  @Prop({ default: false })
  downloaded!: boolean

  @Prop({ type: Object, default: null })
  metadata!: tLocalEventsMetadata

  // XXX If we add some more events, remember to update this to reflect the new
  // values
  @Prop({ type: Object, default: null })
  previousValues!: tLocalEventValue

  // XXX If we add some more events, remember to update this to reflect the new
  // values
  @Prop({ type: Object, default: null })
  currentValues!: tLocalEventValue

  @Prop()
  tenantId!: string
}

export const LocalEventsSchema = generateSchemaWithMiddlewares(LocalEvents)

LocalEventsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
