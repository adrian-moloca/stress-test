import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import { AnesthesiaRegion, AnesthesiaSide, tAnesthesiaSubRegion, AnesthesiologicalService, Identifier, Measures, OpStandardMaterial, OpStandardPosition_Name, PreExistingCondition, OpStandardMedication, SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

export type AnesthesiologistOpStandardDocument = HydratedDocument<AnesthesiologistOpStandard>

@Schema({ timestamps: true })
export class AnesthesiologistOpStandard {
  @Prop({
    type: String,
    default: () => `anesthesiologistOpStandard_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({
    type: String,
    default: () => `version_${Random.id()}`,
    required: true,
  })
  versionId: string

  @Prop()
  name: Identifier

  @Prop()
  validFrom: Date

  @Prop()
  region: AnesthesiaRegion

  @Prop()
  subregion: tAnesthesiaSubRegion

  @Prop()
  side: AnesthesiaSide

  @Prop()
  createdBy: Identifier // userId

  @Prop()
  preExistingConditions: PreExistingCondition[]

  @Prop()
  interoperativeMeasure: Measures[]

  @Prop({ type: Array })
  materials: OpStandardMaterial[]

  @Prop({ type: Array })
  medications: OpStandardMedication[]

  @Prop()
  positions: OpStandardPosition_Name[]

  @Prop()
  ventilationMaterials: OpStandardMaterial[]

  @Prop()
  requiredServices: AnesthesiologicalService[]

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string
}

// eslint-disable-next-line max-len
export const AnesthesiologistOpStandardSchema = generateSchemaWithMiddlewares(AnesthesiologistOpStandard)

AnesthesiologistOpStandardSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.ANESTHESIOLOGIST_OPSTANDARD
})

AnesthesiologistOpStandardSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.anesthesiologistOpStandardId = ret._id
    ret.id = ret._id
    return ret
  },
})
