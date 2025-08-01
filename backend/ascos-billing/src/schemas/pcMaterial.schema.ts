import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { IDebtor, IPcMaterialsPosition, Patient, EPcMaterialsStatus, RecipientType } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type PcMaterialDocument = HydratedDocument<PcMaterial>;

@Schema({ timestamps: true })
export class PcMaterial {
  @Prop({ type: String })
  status: EPcMaterialsStatus

  @Prop()
  recipient: RecipientType

  @Prop()
  external: boolean

  @Prop({ type: Object })
  debtor: IDebtor

  @Prop({ type: Object })
  patient: Patient

  @Prop({ type: Object })
  positions: IPcMaterialsPosition[]

  @Prop({ type: Array<String> })
  missingData: string[]

  @Prop({ type: Array<String> })
  missingItems: string[]

  @Prop()
  caseId: string

  @Prop()
  tenantId: string

  @Prop()
  elaborationInProgress: boolean

  @Prop()
  reviewed: boolean

  @Prop()
  cancelled: boolean
}

export const PcMaterialSchema = generateSchemaWithMiddlewares(PcMaterial)

PcMaterialSchema.index({ tenantId: 1, caseId: 1 })
