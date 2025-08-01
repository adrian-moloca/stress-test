import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { Case, IPcMaterial, IPrescription, ISammelCheckpoint } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type PrescriptionSnapshotDocument = HydratedDocument<PrescriptionSnapshot>;

@Schema({ timestamps: true })
export class PrescriptionSnapshot {
  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  cases: Case[]

  @Prop()
  pcMaterials: IPcMaterial[]

  @Prop({
    type: Object,
  })
  sammelCheckpoint?: ISammelCheckpoint

  @Prop({
    type: Object,
  })
  prescriptionToRefund?: IPrescription

  @Prop()
  isCancellation: boolean

  @Prop()
  tenantId: string
}

export const PrescriptionSnapshotSchema = generateSchemaWithMiddlewares(PrescriptionSnapshot)
