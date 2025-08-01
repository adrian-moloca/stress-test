import _ from 'lodash'
import {
  AnesthesiologicalService,
  CaseStatus,
  Measures,
  OpStandardBodyRegion_Name,
  OpStandardFeet_Name,
  OpStandardFinger_Name,
  OpStandardPosition_Name,
  OpStandardSpinalSegment_Name,
  OpStandardSide_Name,
  ReceiptType,
  RoomType,
  permissionRequests,
  AnesthesiaRegion,
  PreExistingCondition,
  AnesthesiaSide,
  tAnesthesiaSubRegion,
  caseFileSections,
  AnesthesiologistPresence,
  Gender_Name,
  AnesthesiaType,
} from '../enums'
import { checkTwoDatesEqual } from '../utils'
import {
  Address,
  Contract,
  Identifier,
  Patient,
  Timestamps,
  Instruction,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardRequiredSection,
  OpStandardAnesthesiaRow,
  OpStandardEquipment,
  OpStandardSterileGood,
  OpStandardPostOpSection,
  OpStandard,
  AnesthesiologistOpStandard,
} from './dataModel'
import { IUser } from './users'
import { IPcMaterial } from './pcMaterials'
import { tDynamicFields } from './universal-billing'

export interface IListColumn<RowType = any, PropsType = any> {
  index: number;
  field: string;
  vPermission?: permissionRequests;
  oPermission?: permissionRequests;
  valueGetter?: (row: RowType, props?: PropsType) => any;
  renderCell?: (params: any) => string;
  translated?: boolean;
  width?: number;
  missingFilterOption?: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'special';
}

export type ICasesListColumn = IListColumn<ILimitedCase, {
  dateString: string;
  contracts: {
    [contractId: Identifier]: Contract;
  };
}>

export type searchWordsByColumn = {
  dbField: string
  searchWords: string[]
  dbType: 'string' | 'number' | 'date' | 'boolean' | 'special'
  missing: boolean
}

export type CaseNumber = string

export interface Case {
  _id?: Identifier
  caseId: Identifier
  caseNumber: CaseNumber
  bookingPatient: Patient
  costEstimate: CostEstimate
  // TODO: verify if receipts managed like this are sufficients to also represent all payments
  receipts: Receipt[]
  uploads: CaseFileReference[]
  checkinUploads: CaseFileReference[]
  checkoutUploads: CaseFileReference[]
  intraOpUploads: CaseFileReference[]
  timestamps: Timestamps
  status: CaseStatus
  anesthesiologistsId: Identifier[]
  operatingRoomId?: Identifier | null
  snapshottedContract: Contract
  snapshottedCountControl: string[]
  bookingSection: CaseBookingSection
  notesSection: NotesSection
  surgerySection: CaseSurgerySection
  preOpSection: CasePreOpSection
  anesthesiaSection: CaseAnesthesiaSection
  intraOpSection: CaseIntraOpSection
  postOpSection: CasePostOpSection
  lastEdit: Date
  lastStatusEdit: Date | null
  patientRef: string
  associatedPatient: Patient
  associatedDoctor?: IUser | null
  confirmationNote?: string
  updatedAt: Date
  tenantId: string
  closed: boolean
  pcMaterial?: {
    _id: IPcMaterial['_id']
    status: IPcMaterial['status']
    elaborationInProgress: boolean
    cancelled: boolean
  }
  // TODO: parlare della opzionalità
  dynamicFields?: tDynamicFields
}

export type ILimitedCase = {
  caseId: Identifier
  caseNumber: string
  anesthesiologistsId: Identifier[]
  confirmationNote?: string
  patientRef: string
  surgeryName?: string
  bookingSection: {
    name?: string
    contractId: string
    opStandardId: string
    date: Date
    duration: number // in minutes
    doctorId: string
    roomType: string | null
    calendarNotes?: string
    calendarPreOpNotes?: string
    calendarPostOpNotes?: string
  }
  associatedDoctor: {
    id?: string
    _id?: string
    title?: string
    firstName?: string
    lastName?: string
    debtorNumber?: string
  }
  bookingPatient: {
    patientId: string
    name: string
    surname: string
    birthDate: Date
    gender: Gender_Name
    genderSpecifics?: string
    genderBirth: Gender_Name
  }
  operatingRoomId?: string | null
  status: CaseStatus
  timestamps: Timestamps
  lastStatusEdit: Date | null
  tenantId: string
  closed: boolean
  pcMaterial?: {
    _id: IPcMaterial['_id']
    status: IPcMaterial['status']
    elaborationInProgress: boolean
    cancelled: boolean
  }
}

export type ILimitedCaseForCard = ILimitedCase & {
  edited?: boolean
  zIndex?: number
  offset?: number
  closed: boolean
}

export interface ICaseBackup {
  caseId: Identifier
  status: CaseStatus
  orId: Identifier
  date: Date
}

export interface NotesSection {
  notes: string
}

export interface MaterialPrice {
  materialId: string
  materialName: string
  price: number
  amount: number
}

export interface CostEstimatePatient {
  name: string
  surname: string
  birthDate: Date
}

export interface CostEstimateSurgery {
  opstandardId: string
  opstandardName: string
  bookingDate: Date
  doctorId: string
  doctorName: string
}
export interface CostEstimate {
  patient: CostEstimatePatient
  surgery: CostEstimateSurgery
  opvPrice: number | null
  standByPrice: number | null
  generalAnesthesiaPrice: number | null
  materialsPrices: MaterialPrice[]
  useAndCarePrice: number | null
  file: CaseFileReference
  dateOfGeneration: Date
}

export interface ReceiptPatient {
  name: string
  surname: string
}
export interface Receipt {
  type: ReceiptType
  patient: ReceiptPatient
  file: CaseFileReference
  amount: number | null // TODO: this should not be nullable
  dateOfGeneration: Date
  number: number
}

export interface CaseItem {
  code: Identifier // taken from the opStandardMaterial code
  amount: number // amount of this material used in this case
}

export interface CaseSection {
  additionalNotes?: string
  documents?: CaseFileReference[]
}

export interface CaseBookingSection extends CaseSection {
  doctorId: Identifier
  date: Date
  duration: number // in minutes
  contractId: Identifier
  opStandardId: Identifier
  roomType: null | RoomType
  name?: string
  calendarNotes?: string
  calendarPreOpNotes?: string
  calendarPostOpNotes?: string
}

export interface CustomBg {
  company: string
  name: string
  surname: string
  address?: string // Old property, not used anymore
  street: string
  streetNumber: string
  postalCode: string
  city: string
  country: string
  bgDebtorNumber: string
}

export interface CaseFileReference {
  fileId: string
}

export interface FileWithId {
  file: File
  id: string
}

export interface CaseFileToDelete {
  fileId: string
  fileSection: caseFileSections
}

export interface NamedCaseFileToDelete {
  fileId: string
  fileSection: caseFileSections
  displayName: string
}

export interface CaseForm extends Case {
  documentsToUpload: FileWithId[] // files to be uploaded
  checkinDocumentsToUpload: FileWithId[] // files to be uploaded
  checkoutDocumentsToUpload: FileWithId[] // files to be uploaded
  intraOpDocumentsToUpload: FileWithId[] // files to be uploaded
  filesToDelete: CaseFileToDelete[] // files to be deleted
}

export interface CaseSurgerySection extends CaseSection {
  anesthesiologistOpStandardId: Identifier
  side: OpStandardSide_Name
  positions: OpStandardPosition_Name[]
  preferredAnesthesia?: AnesthesiaType
  surgeryBodyLocations: (
    | OpStandardBodyRegion_Name
    | OpStandardSpinalSegment_Name
    | OpStandardFinger_Name
    | number
    | OpStandardFeet_Name
  )[]
}

export interface CasePreOpSection extends CaseSection {
  instructions: CaseInstruction[]
  materials: CaseOpStandardMaterial[]
  medications: CaseOpStandardMedication[]
  notes: string
}

export interface CaseInstruction extends Instruction {
  checked?: boolean
}
export interface CaseAnesthesiaSection extends CaseSection {
  anesthesiologistPresence: AnesthesiologistPresence
  anesthesiologistOpStandardId: Identifier
  name: Identifier
  validFrom: Date
  region: AnesthesiaRegion
  subregion: tAnesthesiaSubRegion
  side: AnesthesiaSide
  createdBy: Identifier // userId
  preExistingConditions: PreExistingCondition[]
  interoperativeMeasure: Measures[]
  materials: CaseOpStandardMaterial[]
  ventilationMaterials: CaseOpStandardMaterial[]
  medications: CaseAnesthesiaMedication[]
  positions: OpStandardPosition_Name[]
  requiredServices: AnesthesiologicalService[]
  suggestedAnesthesiaList: OpStandardAnesthesiaRow[]
  anesthesiaList: OpStandardAnesthesiaRow[]
  volatileAnestheticsTimestamps: {
    oxygen: volatileTimestamp[]
    n20: volatileTimestamp[]
    desflurane: volatileTimestamp[]
    sevoflurane: volatileTimestamp[]
  }
  anesthesiologistOpStandard: AnesthesiologistOpStandard | null
}

export interface volatileTimestamp {
  start: Date | null
  end: Date | null
}

export interface CaseAnesthesiaMedication extends CaseOpStandardMaterial {
  timestamp: Date | null
}

// this a more details version of the case item used only in anesthesia phase
export interface AnesthesiaItem {
  code: Identifier
  dosage: string
  timestamp: Date
}

export interface CaseIntraOpSection extends CaseSection {
  gloves: CaseOpStandardStandardSection
  positions: OpStandardPosition_Name[]
  positionsTimestamps: Date[]
  positioningTools: CaseOpStandardStandardSection
  equipment: CaseOpStandardStandardSection
  disinfection: CaseOpStandardStandardSection
  covering: CaseOpStandardStandardSection
  surgicalInstruments: CaseOpStandardStandardSection
  disposableMaterial: CaseOpStandardStandardSection
  sutureMaterial: CaseOpStandardStandardSection
  medication_rinse: CaseOpStandardStandardSection
  extras: CaseOpStandardStandardSection
  particularities: CaseOpStandardStandardSection
  tourniquet: {
    blutleere: CaseTourniquetSection
    tourniquet: CaseTourniquetSection
  }
  x_ray: CaseXray
  drainage: CaseDrainage
  monopolar: CaseMonopolar
  bipolar: CaseBipolar
  histology: CaseHistology
  bacteriology: CaseBacteriology
  countControl: {
    before: {
      [key: string]: number
    }
    after: {
      [key: string]: number
    }
  }
  notes: string
}

export interface CaseOpStandardStandardSection {
  instructions: CaseInstruction[]
  materials: CaseOpStandardMaterial[]
  medications: CaseOpStandardMedication[]
  equipments: CaseOpStandardEquipment[]
  sterileGoods: CaseOpStandardSterileGood[]
}

export interface CaseBacteriology extends OpStandardRequiredSection {
  bacteriology: boolean
}
export interface CaseHistology extends OpStandardRequiredSection {
  histology: boolean
}
export interface CaseBipolar extends OpStandardRequiredSection {
  bipolar: boolean
}

export interface CaseMonopolar extends OpStandardRequiredSection {
  monopolar: string
}

export interface CaseDrainage extends OpStandardRequiredSection {
  drainage: string
}
export interface CaseXray extends OpStandardRequiredSection {
  c_arm: boolean
  mGycm: string
}
export interface CaseTourniquetSection extends OpStandardRequiredSection {
  mmHg: string
  from: number
  to: number
}
export interface CasePostOpSection extends Omit<OpStandardPostOpSection, 'materials' | 'medications'>, CaseSection {
  materials: CaseOpStandardMaterial[]
  medications: CaseOpStandardMedication[]
}

export interface ThirdPartyBillingContact {
  company: string
  name: string
  surname: string
  address: Address
  thirdPartyDebtorNumber: string
}

export interface AnesthesiologistCaledarInfo {
  name: string
  lastEdit: Date
}

export const checkBookingSectionChanged = (oldCase: Partial<Case>, newCase: Partial<Case>) => {
  const oldBookingSection = oldCase?.bookingSection
  const newBookingSection = newCase?.bookingSection
  if (!oldBookingSection || !newBookingSection) return false

  return (
    oldBookingSection.doctorId !== newBookingSection.doctorId ||
    !checkTwoDatesEqual(oldBookingSection.date, newBookingSection.date) ||
    oldBookingSection.contractId !== newBookingSection.contractId ||
    oldBookingSection.opStandardId !== newBookingSection.opStandardId ||
    oldBookingSection.roomType !== newBookingSection.roomType ||
    oldCase?.notesSection?.notes !== newCase?.notesSection?.notes
  )
}

export const checkSurgerySectionChanged = (oldCase: Partial<Case>, newCase: Partial<Case>) => {
  const oldSurgerySection = oldCase?.surgerySection
  const newSurgerySection = newCase?.surgerySection
  if (!oldSurgerySection || !newSurgerySection) return false

  return !_.isEqual(oldSurgerySection, newSurgerySection)
}

export type CaseOpStandardMedication = Omit<OpStandardMedication, 'prefill'>
export type CaseOpStandardMaterial = Omit<OpStandardMaterial, 'prefill'>
export type CaseOpStandardSterileGood = Omit<OpStandardSterileGood, 'prefill'>
export type CaseOpStandardEquipment = Omit<OpStandardEquipment, 'prefill'>

export type tCaseLastUpdates = {
  [timestampName: string]: Date
}

export type PaginatedCases = {
  results: ILimitedCase[]
  total: number
  currentPage: number
  limit: number
}

export type SnapshottedContract = Contract & {
  // so: this field is here ONLY to perform a full text search. This is due
  // to a limit of mongo that doesn't allow a full text search to an object
  // field (but it does on an array of objects)
  opstandardsArray: OpStandard[]
}

export type tMaterialsCasesFilters = {
  selectedDoctorId: string | undefined
  endDate: Date | null
}
