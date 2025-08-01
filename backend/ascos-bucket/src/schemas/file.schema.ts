import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type FileDocument = HydratedDocument<File>;

@Schema({ timestamps: true })
export class File {
  @Prop()
  name: string

  @Prop()
  type: string

  @Prop()
  fileId: string

  @Prop()
  uploadByUserId: string

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string
}

export const FileSchema = generateSchemaWithMiddlewares(File)

FileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
