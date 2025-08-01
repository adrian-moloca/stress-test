import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { SOURCE_SCHEMAS, tOrScheduling } from '@smambu/lib.constantsjs'

export type OrSchedulingDocument = HydratedDocument<OrSchedulingClass>;

@Schema({ timestamps: true })
export class OrSchedulingClass implements Omit<tOrScheduling, '_id'> {
  @Prop()
  name: string

  @Prop()
  operatingRoomId: string

  @Prop()
  timeStamp: number

  @Prop()
  anestIds: string[]

  @Prop()
  tenantId: string
}

export const OrSchedulingSchema = generateSchemaWithMiddlewares(OrSchedulingClass)

OrSchedulingSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.OR_SCHEDULING
})
