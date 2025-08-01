import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'

import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { RW_PLUGIN_TAG, SOURCE_SCHEMAS, tDynamicSections } from '@smambu/lib.constantsjs'
export type ContractDocument = HydratedDocument<Contract>

@Schema({
  timestamps: false,
  _id: false,
  pluginTags: [RW_PLUGIN_TAG, SOURCE_SCHEMAS.CONTRACTS]
})
export class ContractDetails {
  @Prop({ required: true })
  contractName: string

  @Prop({ required: true })
  doctorId: string

  @Prop()
  kassenzulassung: boolean

  @Prop()
  overnightStayFee1Bed: number

  @Prop()
  overnightStayFee2Bed: number

  @Prop()
  overnightStayFee3Bed: number

  @Prop({ required: true })
  validFrom: Date

  @Prop({ required: true })
  validUntil: Date
}

@Schema({ timestamps: true })
export class Contract {
  @Prop({
    type: String,
    default: () => `contract_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({ type: ContractDetails })
  details: {
    contractName: string
    doctorId: string
    kassenzulassung: boolean
    overnightStayFee1Bed: number
    overnightStayFee2Bed: number
    overnightStayFee3Bed: number
    validFrom: Date
    validUntil: Date
  }

  @Prop()
  createdAt: Date

  @Prop()
  tenantId: string

  @Prop([
    {
      type: String,
      ref: 'OpStandard',
    },
  ])
  opStandards: string[]

  // TODO: ref issue #1433
  @Prop({ type: Object })
  dynamicSections: tDynamicSections | undefined

  @Prop()
  updatedAt: Date
}

export const ContractSchema = generateSchemaWithMiddlewares(Contract)

ContractSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.CONTRACTS })

ContractSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
