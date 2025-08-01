import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'

export type BgDebtorNumberDocument = BgDebtorNumber & Document

@Schema({ timestamps: true })
export class BgDebtorNumber {
  @Prop({
    type: String,
    default: () => `bgDebtorNumber_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop()
  key: string

  @Prop()
  bgDebtorNumber: string

  @Prop()
  tenantId: string
}

export const BgDebtorNumberSchema = generateSchemaWithMiddlewares(BgDebtorNumber)

BgDebtorNumberSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.BGDEBTORNUMBER })
