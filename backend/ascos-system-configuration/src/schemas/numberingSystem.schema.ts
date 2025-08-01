import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { NumberingSystemTypes } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

export type NumberingSystemDocument = HydratedDocument<NumberingSystem>;

@Schema({ timestamps: true })
export class NumberingSystem {
  @Prop({ type: String })
  type: NumberingSystemTypes

  @Prop()
  lastGlobalNumber: number

  @Prop({ type: Object })
  lastYearlyNumber: {
    [year: string]: number
  }

  @Prop()
  tenantId: string
}

export const NumberingSystemSchema = generateSchemaWithMiddlewares(NumberingSystem)
NumberingSystemSchema.index({ type: 1, tenantId: 1 }, { unique: true })
