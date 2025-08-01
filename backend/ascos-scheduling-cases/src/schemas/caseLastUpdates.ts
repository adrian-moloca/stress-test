import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { SOURCE_SCHEMAS, tCaseLastUpdates } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
export type caseLastUpdatesDocument = HydratedDocument<CaseLastUpdates>;

@Schema({ timestamps: true })
export class CaseLastUpdates {
  @Prop()
  caseId: string

  @Prop({ type: Object })
  timestamps: tCaseLastUpdates

  @Prop()
  tenantId: string
}

export const caseLastUpdatesSchema = generateSchemaWithMiddlewares(CaseLastUpdates)

caseLastUpdatesSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.CASES_LAST_UPDATES })

caseLastUpdatesSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
