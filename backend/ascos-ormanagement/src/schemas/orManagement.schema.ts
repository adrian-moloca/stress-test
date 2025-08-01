import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import {
  OperatingRoom,
  OperatingRoomException,
  OperatingRoomStatus,
  SOURCE_SCHEMAS,
} from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

export type OperatingRoomDocument = HydratedDocument<OperatingRoomClass>;

class OperatingRoomExceptionClass implements OperatingRoomException {
  @Prop({ type: Date })
  startDate: Date

  @Prop({ type: Date })
  endDate: Date

  @Prop()
  repeatedEvery: (0 | 1 | 2 | 3 | 4 | 5 | 6)[]
}

@Schema({ timestamps: true })
export class OperatingRoomClass implements OperatingRoom {
  @Prop({
    type: String,
    default: () => `operatingRoom_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop()
  name: string

  @Prop()
  operatingRoomId: string

  // this id is chosen by the user
  @Prop()
  customRoomId: string

  @Prop()
  status: OperatingRoomStatus

  @Prop({ type: OperatingRoomExceptionClass })
  exception: OperatingRoomException

  @Prop()
  notes: string

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string
}

export const OperatingRoomSchema = generateSchemaWithMiddlewares(OperatingRoomClass)

OperatingRoomSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.OR_MANAGEMENT
})

OperatingRoomSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    ret.operatingRoomId = ret._id
    return ret
  },
})
