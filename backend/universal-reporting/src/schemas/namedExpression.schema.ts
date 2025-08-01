import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { tExpression } from '@smambu/lib.constantsjs'

export type NamedExpressionDocument = HydratedDocument<NamedExpression>;

@Schema({ timestamps: true })
export class NamedExpression {
  @Prop({
    type: Object,
  })
  data: tExpression

  @Prop()
  tenantId: string
}

export const NamedExpressionSchema = generateSchemaWithMiddlewares(NamedExpression)
