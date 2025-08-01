import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
export type CaseBackupDocument = HydratedDocument<CaseBackup>;

@Schema()
export class CaseBackupDetails {
  @Prop()
  caseId: string

  @Prop()
  status: string

  @Prop()
  orId: string

  @Prop()
  date: Date
}

@Schema({ timestamps: true })
export class CaseBackup {
  @Prop({})
  cases: CaseBackupDetails[]

  @Prop()
  lockedWeekTimestamp: Number

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string
}

export const CaseBackupSchema = generateSchemaWithMiddlewares(CaseBackup)

CaseBackupSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.CASES_BACKUP })

CaseBackupSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
