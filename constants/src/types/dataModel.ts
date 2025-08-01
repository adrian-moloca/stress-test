import {
  AnesthesiaRegion,
  AnesthesiaSide,
  tAnesthesiaSubRegion,
  AnesthesiaType,
  AnesthesiologicalService,
  AuditTrailActionType,
  ContractStatus,
  Domain_Name,
  Gender_Name,
  InvoiceStatus,
  InvoiceType,
  Measures,
  OpStandardBodyRegion_Name,
  OpStandardFeet_Name,
  OpStandardFinger_Name,
  OpStandardPosition_Name,
  OpStandardSpinalSegment_Name,
  OpStandardSterileGoodType,
  PreExistingCondition,
  ReceiptType,
} from '../enums'
import { CaseNumber } from './cases'
import { ICapabilityName } from './permissions'
import { tDynamicSections } from './universal-billing'
import { IUser } from './users'

// Default type for Ids, being primary key or external key
export type Identifier = string

// TODO verify this
export interface LoginSession {
  userId: Identifier
  startTimestamp: Date
  authToken: string
}

// TODO verify this
export interface ActivationToken {
  id: number
  userId: Identifier
  token: string
  used: boolean
  expired: boolean
}

// TODO verify this
export interface PasswordToken {
  id: number
  userId: Identifier
  token: string
  used: boolean
  expired: boolean
}

export interface Address {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export interface Notification {
  notificationId: Identifier
  userId: Identifier
  generationTimestamp: Date
  readingTimestamp: Date
  title: string
  text: string
}

// new
export interface LoggedUser {
  userId: Identifier
  userEmail: string
  capabilities: ICapabilityName[]
  authToken: string
}

// TODO: veriify -> each capability should be in exactly one domain
export interface Domain {
  name: Domain_Name
  capabilityList: ICapabilityName[]
}

// TODO: verify if insurance can also be of BG type
export interface Patient {
  tenantId: string
  patientId: Identifier
  patientNumber: string
  debtorNumber: string
  title?: string
  name: string
  surname: string
  birthDate: Date
  gender: Gender_Name
  genderSpecifics?: string // Only if gender is Gender_Name.OTHER
  genderBirth: Gender_Name
  nationality: string
  phoneNumber: string
  email: string
  address: Address
  doctorsIds: Identifier[]
}

// TODO: this is an abstraction of a complex data managed by the anagraphic tables. This concept should be expresse here
export interface Material {
  materialId: Identifier
  name: string
  materialCode: string
  price: number
}

// I think there was a disalignment with the "Material" interface and the "useMaterials" hook
export interface NewMaterial {
  id: string
  code: string
  name: string
}

export interface Medication {
  medicationId: Identifier
  name: string
  medicationCode: string
  price: number
}

export interface SterileGood {
  sterileGoodId: Identifier
  code: string
  name: string
  type: OpStandardSterileGoodType
  lotNumber: string
}

export interface Contract {
  tenantId: string
  contractId: Identifier
  details: ContractDetail
  opStandards?: {
    [key: string]: OpStandard
  }
  associatedDoctor?: IUser | null
  // TODO: ref issue #1433
  dynamicSections?: tDynamicSections
}

export type IDataGridContract = {
  contractId: Identifier
  associatedDoctor: {
    firstName?: string
    lastName?: string
    title?: string
  }
  details: {
    contractName: string
    validFrom: Date
    validUntil: Date
    status: ContractStatus
    doctorId: Identifier
  }
}

export interface ContractDetail {
  contractName: string
  doctorId: Identifier
  kassenzulassung: boolean
  validFrom: number | Date
  validUntil: number | Date
  overnightStayFee1Bed?: number
  overnightStayFee2Bed?: number
  overnightStayFee3Bed?: number
  surgerySlots?: SurgerySlot[]
  status?: ContractStatus
}

export interface SurgerySlot {
  id?: string
  from: number | Date
  to: number | Date
}

export interface Timestamps {
  patientArrivalTimestamp: Date
  preopStartedTimestamp: Date
  preopFinishedTimestamp: Date
  anesthesiologistOnSiteTimestamp: Date
  anesthesiaStartedTimestamp: Date
  intubationTimestap: Date
  releaseForSurgeryTimestap: Date
  cutTimestap: Date
  endOfSurgeryTimestap: Date
  extubationTimestap: Date
  anesthesiaFinishedTimestap: Date
  surgeryStartTimestamp: Date
  surgeryEndTimestamp: Date
  roomEnterTimestamp: Date
  readyForRecoveryTimestamp: Date
  roomExitTimestmap: Date
  postOpStartedTimestap: Date
  postOpFinishedTimestap: Date
  dischargedTimestamp: Date
  arrivedInRecoveryRoomTimestamp: Date
  readyForReleaseTimestamp: Date
  endOfSurgicalMeasuresTimestamp: Date
}

export const TimestampsSplittedByTab = {
  checkin: ['patientArrivalTimestamp'],
  anesthesia: [
    'roomEnterTimestamp',
    'readyForRecoveryTimestamp',
    'roomExitTimestmap',
    'anesthesiologistOnSiteTimestamp',
    'intubationTimestap',
    'cutTimestap',
    'extubationTimestap',
    'anesthesiaStartedTimestamp',
    'releaseForSurgeryTimestap',
    'endOfSurgicalMeasuresTimestamp',
    'anesthesiaFinishedTimestap',
  ],
  preOp: ['preopStartedTimestamp', 'preopFinishedTimestamp'],
  intraOp: [
    'surgeryStartTimestamp',
    'surgeryEndTimestamp',
    'cutTimestap',
    'roomEnterTimestamp',
    'readyForRecoveryTimestamp',
    'roomExitTimestmap',
  ],
  postOp: [
    'postOpStartedTimestap',
    'postOpFinishedTimestap',
    'arrivedInRecoveryRoomTimestamp',
    'readyForReleaseTimestamp',
  ],
  checkout: ['dischargedTimestamp'],
}

export interface FileItem {
  id: string
  file: File
}

export interface InvoiceRow {
  date: Date
  shortName: string
  description: string
  amount: number
  unitPrice: number
  rowTotalPrice: number
}

export interface SectionedDocumentation<TItem> {
  gloves: TItem[]
  positioning: TItem[]
  positioningTools: TItem[]
  equipment: TItem[]
  disinfection: TItem[]
  covering: TItem[]
  surgicalInstruments: TItem[]
  disposableMaterials: TItem[]
  medicationRinse: TItem[]
  extras: TItem[]
  particularities: TItem[]
  tourniquet: TItem[]
  xRay: TItem[]
  drainage: TItem[]
  monopolar: TItem[]
  bypolar: TItem[]
  histology: TItem[]
  bacteriology: TItem[]
}

export interface Invoice {
  tenantId: string
  invoiceNumber: Identifier
  emissionDate: Date
  dueDate: Date
  recipientType: ReceiptType
  recipient: string
  invoiceType: InvoiceType
  total: number
  status: InvoiceStatus
  cases: CaseNumber[]
  rows: InvoiceRow[]
}

export interface AnesthesiologistOpStandard {
  _id?: Identifier
  anesthesiologistOpStandardId: Identifier
  name: Identifier
  validFrom: Date
  createdBy: Identifier // userId
  preExistingConditions: PreExistingCondition[]
  interoperativeMeasure: Measures[]
  materials: OpStandardMaterial[]
  ventilationMaterials: OpStandardMaterial[]
  medications: OpStandardMedication[]
  positions: OpStandardPosition_Name[]
  requiredServices: AnesthesiologicalService[]
  tenantId: string
}

export interface OpStandard {
  tenantId: string
  _id?: Identifier
  id?: Identifier
  opStandardId: Identifier
  name: string
  previousContractOpStandardId: Identifier | null
  subjectArea?: string
  surgeryDurationInMinutes: number
  operatingRoomIds: Identifier[]

  bookingSection: OpStandardBookingSection
  preOpSection: OpStandardPreOpSection
  intraOpSection: OpStandardIntraOpSection
  postOpSection: OpStandardPostOpSection
  changeRequest: string
  // TODO: ref issue #1433
  dynamicSections?: tDynamicSections
}

export interface OpStandardCreationProps extends Omit<OpStandard, 'opStandardId' | 'tenantId'> {
  id: undefined
  _id: undefined
  opStandardId: undefined
}

export interface OpStandardAnesthesiaRow {
  anesthesiaType: AnesthesiaType
  anesthesiaBodyRegion: AnesthesiaRegion | ''
  anesthesiaBodySubRegion: tAnesthesiaSubRegion | ''
  side: AnesthesiaSide | ''
}

export interface OpStandardBookingSection {
  anesthesiaList: OpStandardAnesthesiaRow[]
  sideRequired: boolean
  bodyRegions: OpStandardBodyRegion_Name[]
  spinalSegments: OpStandardSpinalSegment_Name[]
  fingers: OpStandardFinger_Name[]
  teeth: number[]
  feet: OpStandardFeet_Name[]
  positions: OpStandardPosition_Name[]
  userCanUploadDocuments: boolean
}

// OP-STANDARD PRE-OP

export interface OpStandardPreOpSection {
  instructions: Instruction[]
  materials: OpStandardMaterial[]
  medications: OpStandardMedication[]
  notes: string
}

// OP-STANDARD INTRA-OP

export interface OpStandardIntraOpSection {
  gloves: OpStandardStandardSection
  positions: OpStandardPosition_Name[]
  positioningTools: OpStandardStandardSection
  equipment: OpStandardStandardSection
  disinfection: OpStandardStandardSection
  covering: OpStandardStandardSection
  surgicalInstruments: OpStandardStandardSection
  disposableMaterial: OpStandardStandardSection
  sutureMaterial: OpStandardStandardSection
  medication_rinse: OpStandardStandardSection
  extras: OpStandardStandardSection
  particularities: OpStandardStandardSection
  tourniquet: {
    blutleere: OpStandardRequiredSection
    tourniquet: OpStandardRequiredSection
  }
  x_ray: OpStandardRequiredSection
  drainage: OpStandardRequiredSection
  monopolar: OpStandardRequiredSection
  bipolar: OpStandardRequiredSection
  histology: OpStandardRequiredSection
  bacteriology: OpStandardRequiredSection
  notes: string
}

export interface OpStandardStandardSection {
  instructions: Instruction[]
  materials: OpStandardMaterial[]
  medications: OpStandardMedication[]
  equipments: OpStandardEquipment[]
  sterileGoods: OpStandardSterileGood[]
}

export interface OpStandardRequiredSection {
  required: boolean
}

export interface OpStandardSterileGood {
  unitType: string
  sterileGood: string
  amount: number
  prefill: boolean
  notes: string
}

export interface OpStandardPostOpSection {
  instructions: Instruction[]
  materials: OpStandardMaterial[]
  medications: OpStandardMedication[]
  postOperativeMeasures: Measures[]
  anesthesiologicalServices: AnesthesiologicalService[]
  notes: string
}

export interface OpStandardMedication {
  medicationId: Identifier
  amount: number
  dosage: number
  units: string
  prefill: boolean
  notes: string
}

export interface OpStandardMaterial {
  materialId: Identifier
  amount: number
  prefill: boolean
  notes: string
}

export interface OpStandardEquipment {
  name: string
  amount: number
  prefill: boolean
  notes: string
}

export interface Instruction {
  content: string
  mandatory: boolean
}

export interface BillingA {
  minimumCharge: number
  scenario: number
}

export interface BillingB {
  minimumCharge: number
  scenario: number
}

export interface BillingC1 {
  firstHourWithAnesthesiologistFee: number
  withAnesthesiologistFeePerMinute: number
  noAnesthesiologistFeePerMinute: number
  materialPrices: MaterialPriceOverride[] // associates materialId to a new price
}

export interface BillingC2 {
  opstandardOverrides: OpstandardOverride[]
}

export interface OpstandardOverride {
  opStandardId: Identifier
  charge: number
  anesthesiaFee: number
  materialPrices: MaterialPriceOverride[]
  insurances: InsuranceEntry[]
}

export interface BillingC3 {
  firstHourFee: number
  halfHourFee: number
}

export interface BillingD {
  opstandardOverrides: OpstandardOverride[]
}

export interface BillingE {
  minimumCharge: number
  scenario: number
}

export interface BillingG {
  firstHourWithAnesthesiologistFee: number
  withAnesthesiologistFeePerMinute: number
  noAnesthesiologistFeePerMinute: number
  materialPrices: MaterialPriceOverride[] // associates materialId to a new price
}

export interface MaterialPriceOverride {
  id: Identifier
  price: number
}

// TODO this seems unused
export interface VATConfiguration {
  fullVatPercent: number
  halfVatPercent: number
  validFrom: Date
}

export interface EBMAnagraphicEntry {
  'EBM-Ziffer': string
  'EBM:Bezeichnung': string
  Punktzahl: string
  'EBM:Betrag': string
  Waehrung: string
  'Zusatzkennzeichen ': string
  gueltigab: string
  gueltigbis: string
  geaendert: string
}

export interface VersionedOPSCatalogueList {
  versionDate: Date
  items: OPSCatalogueEntry[]
}

export interface OPSCatalogueEntry {
  OPS: string
  Seite: string
  'Bezeichnung OPS': string
  Kategorie: string
  'ambulante Operation': string
  'belegärztliche Operation': string
  'Überwachungs-komplex ambulant': string
  'Überwachungs-komplex belegärztlich': string
  'Behandlungskomplex Überweisung nur ambulant': string
  'Behandlungskomplex Operateur nur ambulant': string
  'ambulante Anästhesie': string
  'belegärztliche Anästhesie': string
}

export interface VersionedEBMList {
  versionDate: Date
  items: EBMEntry[]
}

export interface EBMEntry {
  'EBM-Ziffer': string
  'EBM:Bezeichnung': string
  Punktzahl: string
  'EBM:Betrag': string
  Waehrung: string
  'Zusatzkennzeichen ': string
  gueltigab: string
  gueltigbis: string
  geaendert: string
}

export interface VersionedSterileGoodList {
  versionDate: Date
  items: SterileGoodEntry[]
}

export interface SterileGoodEntry {
  Code: string
  'Seriennr.': string
  Bezeichnung: string
  'Anz.': string
}

export interface VersionedInsuranceList {
  versionDate: Date
  items: InsuranceEntry[]
}

export interface InsuranceEntry {
  nummer: string
}

export interface PublicInsuranceEntry extends InsuranceEntry {
  Kassensuchname: string
  Langtext: string
  AbrechnungsNummer: string
  GO: string
  Kostenträgeruntergruppe: string
  Kostenträgergruppe: string
  Kassengruppe: string
  Abrechnungsart: string
  AufnehmenderKostentraeger: string
  ErstesAbrechnungsQuartal: string
  LetztesAbrechnungsQuartal: string
  AdressNummer: string
  Vertragsart: string
  FormularNummer: string
  MahnFormularNummer: string
  FaktorNummer: string
  KasseGeschützt: string
}

export interface PrivateInsuranceEntry extends InsuranceEntry {
  AbrechnungsNummer: string
  RegulierungsNummer: string
  Langtext: string
  GO: string
  Kassengruppe: string
  FaktorNummer: string
  MahnFormularNummer: string
  FormularNummer: string
  AdressNummer: string
  KasseGeschützt: string
  Vertragsart: string
  MandantAnlage: string
  UserAnlage: string
  DatumAnlage: string
  MandantGeändert: string
  UserGeändert: string
  DatumÄnderung: string
}

export interface BGInsuranceEntry extends PrivateInsuranceEntry {
  address: Address
}

export interface AuditTrail {
  tenantId: string
  timestamp: Date
  userId: Identifier
  username: string
  entityType: string
  entityId: string
  databaseId: String
  field: string
  action: AuditTrailActionType
  previousValue: string
  newValue: string
}

export interface Log {
  tenantId: string
  createdAt: Date
  updatedAt: Date
  component: string
  level: number
  message: string
}

export interface Scenario {
  id: number
  name: string // id are not unique, name are
}

export type Scenarios = Scenario[]

export type FileDocument = {
  _id: string;
  id: string;
  name: string;
  type: string;
  fileId: string;
  uploadByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}
