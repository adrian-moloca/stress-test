import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { IArticleConsumption } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type SammelCheckpointDocument = HydratedDocument<SammelCheckpoint>;

@Schema({ timestamps: true })
export class SammelCheckpoint {
  @Prop()
  createdAt: Date

  @Prop()
  doctorId: string

  @Prop({ type: Object })
  consumptions: IArticleConsumption[]

  @Prop()
  tenantId: string
}

export const SammelCheckpointSchema = generateSchemaWithMiddlewares(SammelCheckpoint)

SammelCheckpointSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
