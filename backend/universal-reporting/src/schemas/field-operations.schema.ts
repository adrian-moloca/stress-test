import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { tDependencyJobType, tField } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

@Schema({ timestamps: true })
export class FieldOperations {
  @Prop()
  type: tDependencyJobType

  @Prop({ type: Object })
  field: tField

  @Prop()
  domainId: string

  @Prop()
  tenantId: string

  @Prop()
  blocking: boolean

  @Prop()
  processed: boolean
}

export type FieldOperationsDocument = HydratedDocument<FieldOperations>

export const FieldOperationsSchema = generateSchemaWithMiddlewares(FieldOperations)

FieldOperationsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
