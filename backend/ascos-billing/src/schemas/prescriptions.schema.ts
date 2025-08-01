import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'
import { IDebtor, Patient, EPrescriptionStatus } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument, ObjectId } from 'mongoose'

export type PrescriptionsDocument = HydratedDocument<Prescription>;

@Schema({ timestamps: true })
export class Prescription {
  _id: ObjectId

  @Prop()
  createdAt: Date

  @Prop()
  prescriptionNumber: string

  @Prop()
  creatordId: string

  @Prop({ type: Object })
  debtor: IDebtor

  @Prop({ type: Array })
  patients: {
    name: Patient['name']
    surname: Patient['surname']
    birthDate: Patient['birthDate']
    patientId: Patient['patientId']
  }[]

  @Prop()
  casesRef: string[]

  @Prop({ type: String })
  status: EPrescriptionStatus

  @Prop()
  pcMaterialsRef: string[]

  @Prop()
  doctorsIds: string[]

  @Prop()
  sammelCheckpointRef: string | null

  @Prop()
  prescriptionSnapshotRef: string

  @Prop()
  tenantId: string

  @Prop()
  creatorId: string
}

export const PrescriptionSchema = generateSchemaWithMiddlewares(Prescription)
