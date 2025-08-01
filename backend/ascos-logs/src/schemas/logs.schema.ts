import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

export type LogsDocument = HydratedDocument<Logs>

@Schema({ timestamps: true })
export class Logs {
  @Prop({
    type: String,
    default: () => `logs_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({ type: String })
  component: string

  @Prop({ type: String })
  level: string

  @Prop({ type: String })
  message: string

  @Prop({ type: Object })
  createdAt: Date

  @Prop({ type: Object })
  updatedAt: Date

  @Prop()
  tenantId: string
}

export const LogsSchema = generateSchemaWithMiddlewares(Logs)
LogsSchema.index({
  createdAt: 1,
})

LogsSchema.index({
  message: 'text',
})

LogsSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
