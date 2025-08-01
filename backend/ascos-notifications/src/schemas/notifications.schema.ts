import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { NotificationActionType, NotificationStatus, NotificationType } from '@smambu/lib.constantsjs'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

export type NotificationDocument = NotificationData & Document

@Schema({ timestamps: true })
export class NotificationData {
  @Prop({
    type: String,
    default: () => `notif_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({ type: String })
  to: string

  @Prop({ type: String })
  status: NotificationStatus

  @Prop({ type: String })
  type: NotificationType

  @Prop({ type: String })
  title: string

  @Prop({ type: String })
  body: string

  @Prop({ type: Object })
  action: {
    type: NotificationActionType | null
    url?: string
    date?: Date
  }

  @Prop({ type: Date })
  createdAt: Date

  @Prop({ type: Date })
  updatedAt: Date

  @Prop({ type: Date })
  readedAt: Date

  @Prop({ type: Object })
  timestamps: Record<string, Date>

  @Prop()
  tenantId: string
}

export const NotificationsDataSchema = generateSchemaWithMiddlewares(NotificationData)

NotificationsDataSchema.index({ tenantId: 1, to: 1, createdAt: -1 })
