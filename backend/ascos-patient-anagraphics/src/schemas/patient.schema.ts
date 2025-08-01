import { Address, Gender_Name, SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ timestamps: true })
export class Patient {
  @Prop()
  patientNumber: string

  @Prop()
  debtorNumber: string

  @Prop()
  title: string

  @Prop()
  name: string

  @Prop()
  surname: string

  @Prop({ type: Date })
  birthDate: Date

  @Prop()
  gender: Gender_Name

  @Prop()
  genderSpecifics: string

  @Prop()
  genderBirth: Gender_Name

  @Prop()
  nationality: string

  @Prop()
  phoneNumber: string

  @Prop()
  email: string

  @Prop({ type: Object })
  address: Address

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string
}

export const PatientSchema = generateSchemaWithMiddlewares(Patient)

PatientSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.PATIENT_ANAGRAPHICS })

PatientSchema.virtual('patientId').get(function () {
  return this._id.toHexString()
})

PatientSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    ret.patientId = ret._id
    return ret
  },
})

PatientSchema.index({ '$**': 'text' })

PatientSchema.index({
  tenantId: 1,
  'address.city': 1,
  'address.postalCode': 1,
  'address.country': 1,
  'address.street': 1,
  'address.houseNumber': 1,
})
PatientSchema.index({ tenantId: 1, cardInsuranceNumber: 1 })
PatientSchema.index({ tenantId: 1, date: 1, name: 1, surname: 1 })
