import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import {
  AnesthesiaSide,
  Identifier,
  Instruction,
  OpStandardBodyRegion_Name,
  OpStandardBookingSection,
  OpStandardEquipment,
  OpStandardFeet_Name,
  OpStandardFinger_Name,
  OpStandardStandardSection,
  OpStandardIntraOpSection,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardPosition_Name,
  OpStandardPreOpSection,
  OpStandardPostOpSection,
  OpStandardSpinalSegment_Name,
  OpStandardSterileGood,
  OpStandardAnesthesiaRow,
  AnesthesiaRegion,
  tAnesthesiaSubRegion,
  AnesthesiaType,
  OpStandardRequiredSection,
  SOURCE_SCHEMAS,
  tDynamicSections,
  RW_PLUGIN_TAG
} from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

export type OpStandardDocument = HydratedDocument<OpStandard>

@Schema({
  timestamps: false,
  _id: false,
  pluginTags: [RW_PLUGIN_TAG, SOURCE_SCHEMAS.OPSTANDARDS]
})
export class AnesthesiaRowSchema {
  @Prop({ type: String })
  anesthesiaType: AnesthesiaType

  @Prop({ type: String })
  anesthesiaBodyRegion: AnesthesiaRegion | ''

  @Prop({ type: String })
  anesthesiaBodySubRegion: tAnesthesiaSubRegion | ''

  @Prop({ type: String })
  side: AnesthesiaSide | ''
}

@Schema({ timestamps: false, _id: false })
export class OpStandardBooking {
  @Prop([{ type: AnesthesiaRowSchema }])
  anesthesiaList: OpStandardAnesthesiaRow[]

  @Prop({ type: Boolean })
  sideRequired: boolean

  @Prop([{ type: String }])
  bodyRegions: OpStandardBodyRegion_Name[]

  @Prop([{ type: String }])
  spinalSegments: OpStandardSpinalSegment_Name[]

  @Prop([{ type: String }])
  fingers: OpStandardFinger_Name[]

  @Prop([{ type: Number }])
  teeth: number[]

  @Prop([{ type: String }])
  feet: OpStandardFeet_Name[]

  @Prop([{ type: String }])
  positions: OpStandardPosition_Name[]

  @Prop({ type: Boolean })
  userCanUploadDocuments: boolean
}

@Schema({ timestamps: false, _id: false })
export class InstructionSchema {
  @Prop({ type: String })
  content: string

  @Prop({ type: Boolean })
  mandatory: boolean
}

@Schema({ timestamps: false, _id: false })
export class OpStandardMaterialSchema {
  @Prop({ type: String })
  materialId: string

  @Prop({ type: Number })
  amount: number

  @Prop({ type: Boolean })
  prefill: boolean

  @Prop({ type: Boolean })
  mandatory: boolean

  @Prop({ type: String })
  notes: string
}

@Schema({ timestamps: false, _id: false })
export class OpStandardMedicationSchema {
  @Prop({ type: String })
  medicationId: string

  @Prop({ type: Number })
  amount: number

  @Prop({ type: Number })
  dosage: number

  @Prop({ type: String })
  units: string

  @Prop({ type: Boolean })
  prefill: boolean

  @Prop({ type: Boolean })
  mandatory: boolean

  @Prop({ type: String })
  notes: string
}

@Schema({ timestamps: false, _id: false })
export class OpStandardEquipmentSchema {
  @Prop({ type: String })
  name: string

  @Prop({ type: Number })
  amount: number

  @Prop({ type: Boolean })
  prefill: boolean

  @Prop({ type: Boolean })
  mandatory: boolean

  @Prop({ type: String })
  notes: string
}

@Schema({ timestamps: false, _id: false })
export class OpStandardSterileGoodSchema {
  @Prop({ type: String })
  unitType: string

  @Prop({ type: String })
  sterileGood: string

  @Prop({ type: Number })
  amount: number

  @Prop({ type: Boolean })
  prefill: boolean

  @Prop({ type: Boolean })
  mandatory: boolean

  @Prop({ type: String })
  notes: string
}

@Schema({ timestamps: false, _id: false })
export class OpStandardStandardSchema {
  @Prop([{ type: InstructionSchema }])
  instructions: Instruction[]

  @Prop([{ type: OpStandardMaterialSchema }])
  materials: OpStandardMaterial[]

  @Prop([{ type: OpStandardMedicationSchema }])
  medications: OpStandardMedication[]

  @Prop([{ type: OpStandardEquipmentSchema }])
  equipments: OpStandardEquipment[]

  @Prop([{ type: OpStandardSterileGoodSchema }])
  sterileGoods: OpStandardSterileGood[]
}

@Schema({ timestamps: false, _id: false })
export class OpStandardRequiredSchema {
  @Prop({ type: Boolean })
  required: boolean
}

@Schema({ timestamps: false, _id: false })
export class OpStandardTourniquetSchema {
  @Prop({ type: OpStandardRequiredSchema })
  blutleere: OpStandardRequiredSection

  @Prop({ type: OpStandardRequiredSchema })
  tourniquet: OpStandardRequiredSection
}

@Schema({ timestamps: false, _id: false })
export class OpStandardPreOp {
  @Prop([{ type: InstructionSchema }])
  instructions: Instruction[]

  @Prop([{ type: OpStandardMaterialSchema }])
  materials: OpStandardMaterial[]

  @Prop([{ type: OpStandardMedicationSchema }])
  medications: OpStandardMedication[]

  @Prop({ type: String })
  notes: string
}

@Schema({ timestamps: false, _id: false })
export class OpStandardIntraOp {
  @Prop({ type: OpStandardStandardSchema })
  gloves: OpStandardStandardSection

  @Prop([{ type: String }])
  positions: string[]

  @Prop({ type: OpStandardStandardSchema })
  positioningTools: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  equipment: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  disinfection: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  covering: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  surgicalInstruments: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  disposableMaterial: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  sutureMaterial: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  medication_rinse: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  extras: OpStandardStandardSection

  @Prop({ type: OpStandardStandardSchema })
  particularities: OpStandardStandardSection

  @Prop({ type: OpStandardTourniquetSchema })
  tourniquet: {
    blutleere: OpStandardRequiredSection
    tourniquet: OpStandardRequiredSection
  }

  @Prop({ type: OpStandardRequiredSchema })
  x_ray: OpStandardRequiredSection

  @Prop({ type: OpStandardRequiredSchema })
  drainage: OpStandardRequiredSection

  @Prop({ type: OpStandardRequiredSchema })
  monopolar: OpStandardRequiredSection

  @Prop({ type: OpStandardRequiredSchema })
  bipolar: OpStandardRequiredSection

  @Prop({ type: OpStandardRequiredSchema })
  histology: OpStandardRequiredSection

  @Prop({ type: OpStandardRequiredSchema })
  bacteriology: OpStandardRequiredSection

  @Prop({ type: String })
  notes: string
}

@Schema({ timestamps: false, _id: false })
export class OpStandardPostOp {
  @Prop([{ type: InstructionSchema }])
  instructions: Instruction[]

  @Prop([{ type: OpStandardMaterialSchema }])
  materials: OpStandardMaterial[]

  @Prop([{ type: OpStandardMedicationSchema }])
  medications: OpStandardMedication[]

  @Prop([{ type: String }])
  postOperativeMeasures: string[]

  @Prop([{ type: String }])
  anesthesiologicalServices: string[]

  @Prop({ type: String })
  notes: string
}

@Schema({ timestamps: true })
export class OpStandard {
  @Prop({
    type: String,
    default: () => `op_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({ type: String, required: true })
  name: string

  @Prop({ type: String })
  previousContractOpStandardId: string

  @Prop({ type: String })
  subjectArea: string

  @Prop({ type: Number })
  surgeryDurationInMinutes: number

  @Prop([{ type: String }])
  operatingRoomIds: Identifier[]

  @Prop({ type: OpStandardBooking })
  bookingSection: OpStandardBookingSection

  @Prop({ type: OpStandardPreOp })
  preOpSection: OpStandardPreOpSection

  @Prop({ type: OpStandardIntraOp })
  intraOpSection: OpStandardIntraOpSection

  @Prop({ type: OpStandardPostOp })
  postOpSection: OpStandardPostOpSection

  @Prop()
  changeRequest: string

  // TODO: ref issue #1433
  @Prop({ type: Object })
  dynamicSections: tDynamicSections | undefined

  @Prop()
  tenantId: string
}

export const OpStandardSchema = generateSchemaWithMiddlewares(OpStandard)

OpStandardSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.OPSTANDARDS })

OpStandardSchema.virtual('opStandardId').get(function () {
  return this._id
})

OpStandardSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
