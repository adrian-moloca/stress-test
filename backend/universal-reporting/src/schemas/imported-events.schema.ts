import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { tLocalEventsMetadata, tLocalEventValue, tValidEventName } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

export type ImportedEventsDocument = HydratedDocument<ImportedEvents>;

@Schema({ timestamps: true })
export class ImportedEvents {
  @Prop({ type: String })
  source!: tValidEventName

  @Prop({ type: Types.ObjectId })
  sourceDocId!: string

  @Prop({ type: Object, default: null })
  metadata!: tLocalEventsMetadata

  @Prop({ default: false })
  processed: boolean

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

export const ImportedEventsSchema = generateSchemaWithMiddlewares(ImportedEvents)

ImportedEventsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
