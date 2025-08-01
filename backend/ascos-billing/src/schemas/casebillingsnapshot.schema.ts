import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import {
  Case, Contract, GOAAnagraphic, ICaseOPItem, IEBMAnagraphic,
  IGeneralData, IParsedBG, IVATAnagraphic
} from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type CaseBillingSnapshotDocument = HydratedDocument<CaseBillingSnapshot>;

@Schema({ timestamps: true })
export class CaseBillingSnapshot {
  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop({ type: Object })
  case: Case

  @Prop({ type: Object })
  contract: Contract

  @Prop({ type: Object })
  goaAnagraphic: GOAAnagraphic

  @Prop({ type: Object })
  caseOPItems: ICaseOPItem[]

  @Prop({ type: Object })
  anesthesiaOPItems: ICaseOPItem[]

  @Prop({ type: Object })
  externalMaterialPrices: ICaseOPItem[]

  @Prop({ type: Object })
  parsedBG: IParsedBG

  @Prop({ type: Object })
  ebmAnagraphic: IEBMAnagraphic

  @Prop({ type: Object })
  vatAnagraphic: IVATAnagraphic[]

  @Prop({ type: Object })
  generalData: IGeneralData

  @Prop({ type: Array<String> })
  missingData: string[]

  @Prop({ type: Array<String> })
  missingItems: string[]

  @Prop()
  tenantId: string
}

export const CaseBillingSnapshotSchema = generateSchemaWithMiddlewares(CaseBillingSnapshot)

CaseBillingSnapshotSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})

CaseBillingSnapshotSchema.index({ tenantId: 1, 'case.caseId': 1 })
