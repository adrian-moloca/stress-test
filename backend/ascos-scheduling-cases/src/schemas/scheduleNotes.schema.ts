import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { eScheduleNoteTimeSteps, SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
export type ScheduleNotesDocument = HydratedDocument<ScheduleNotes>;

@Schema({ timestamps: true })
export class ScheduleNotes {
  @Prop({ type: String })
  timeStep: eScheduleNoteTimeSteps

  @Prop()
  text: string

  @Prop()
  timestamp: number

  @Prop()
  createdBy: string

  @Prop()
  tenantId: string
}

export const ScheduleNotesSchema = generateSchemaWithMiddlewares(ScheduleNotes)

ScheduleNotesSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.SCHEDULE_NOTES })
