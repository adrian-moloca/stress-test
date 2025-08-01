import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import {
  CaseAnesthesiaSection,
  CaseBookingSection,
  CaseIntraOpSection,
  CasePostOpSection,
  CasePreOpSection,
  CaseStatus,
  CaseSurgerySection,
  CostEstimate,
  Identifier,
  Patient,
  Receipt,
  Timestamps,
  CaseFileReference,
  NotesSection,
  IUser,
  SnapshottedContract,
  EPcMaterialsStatus,
  SOURCE_SCHEMAS,
  tDynamicFields,
  RW_PLUGIN_TAG,
} from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { isValid } from 'date-fns'
import { toDate } from 'date-fns-tz'
import { HydratedDocument } from 'mongoose'
export type CaseDocument = HydratedDocument<Case>

@Schema({
  timestamps: true,
  pluginTags: [RW_PLUGIN_TAG, SOURCE_SCHEMAS.CASES]
})
export class Case {
  @Prop()
  caseNumber: string

  @Prop({ type: Object })
  bookingPatient: Patient

  @Prop({ type: Object })
  costEstimate: CostEstimate

  @Prop({ type: Object })
  receipts: Receipt[]

  @Prop({ type: Object })
  uploads: CaseFileReference[]

  @Prop({ type: Object })
  checkinUploads: CaseFileReference[]

  @Prop({ type: Object })
  checkoutUploads: CaseFileReference[]

  @Prop({ type: Object })
  intraOpUploads: CaseFileReference[]

  @Prop({ type: Object })
  timestamps: Timestamps

  @Prop()
  status: CaseStatus

  @Prop()
  anesthesiologistsId: Identifier[]

  @Prop()
  operatingRoomId: Identifier

  @Prop({ type: Object })
  snapshottedContract: SnapshottedContract

  @Prop({ type: Object })
  bookingSection: CaseBookingSection

  @Prop({ type: Object })
  surgerySection: CaseSurgerySection

  @Prop({ type: Object })
  preOpSection: CasePreOpSection

  @Prop({ type: Object })
  anesthesiaSection: CaseAnesthesiaSection

  @Prop({ type: Object })
  intraOpSection: CaseIntraOpSection

  @Prop({ type: Object })
  postOpSection: CasePostOpSection

  @Prop({ type: Object })
  notesSection: NotesSection

  @Prop({ type: Object })
  lastEdit: Date

  @Prop({ type: Object })
  lastStatusEdit: Date

  @Prop()
  snapshottedCountControl: string[]

  @Prop()
  patientRef: string

  @Prop()
  confirmationNote: string

  @Prop()
  confirmationRequestor: string

  @Prop({ type: Object })
  associatedDoctor: IUser

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string

  @Prop()
  closed: boolean

  @Prop({
    type: Object,
  })
  pcMaterial: {
    _id: string,
    status: EPcMaterialsStatus,
    elaborationInProgress: boolean,
    cancelled: boolean,
  }

  // TODO: ref issue #1433
  @Prop({ type: Object })
  dynamicFields: tDynamicFields | undefined
}

export const CaseSchema = generateSchemaWithMiddlewares(Case)

CaseSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.CASES })

CaseSchema.index({
  'snapshottedContract.opstandardsArray.name': 'text',
  'associatedDoctor.firstName': 'text',
  'associatedDoctor.lastName': 'text',
  'bookingPatient.name': 'text',
  'bookingPatient.surname': 'text',
  'bookingPatient.patientId': 'text',
  status: 'text',
  caseNumber: 'text',
})

CaseSchema.virtual('caseId').get(function () {
  return this._id.toHexString()
})

CaseSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})

// This is the pre-save hook that was in the ParseCreateCase pipe
// It is necessary for the exportData.resetTenantsData function
CaseSchema.pre('insertMany', function (next, docs) {
  docs.forEach(doc => {
    if (doc.bookingSection.date)
      doc.bookingSection.date = new Date(doc.bookingSection.date)

    if (doc.bookingPatient.birthDate != null) {
      const birthdate = toDate(doc.bookingPatient.birthDate, { timeZone: 'UTC' })
      if (isValid(birthdate))
        doc.bookingPatient.birthDate = birthdate
    }
  })

  next()
})

CaseSchema.index({ tenantId: 1, patientRef: 1 })
CaseSchema.index({ tenantId: 1, closed: 1, 'bookingSection.date': 1 })
CaseSchema.index({ tenantId: 1, 'bookingSection.doctorId': 1, 'bookingSection.date': -1 })
CaseSchema.index({ tenantId: 1, 'associatedDoctor.id': 1, 'billingSection.neededInvoiceTypes': 1, status: 1, 'bookingSection.date': 1 })
CaseSchema.index({ tenantId: 1, closed: 1, 'bookingSection.doctorId': 1, 'bookingSection.date': 1 })
CaseSchema.index({ tenantId: 1, createdAt: 1, 'bookingPatient.patientId': 1 })
CaseSchema.index({ tenantId: 1, 'bookingSection.contractId': 1, 'bookingSection.date': 1 })
CaseSchema.index({ tenantId: 1, 'bookingSection.date': 1 })
