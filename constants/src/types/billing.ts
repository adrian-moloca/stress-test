import { CaseStatus, IGeneralData, InvoiceStatus, InvoiceType, MissingInfo, RecipientType, anagraphicsTypes } from '../enums'
import { Case } from './cases'
import { Contract, Identifier, Patient } from './dataModel'
import { IAddress } from './users'

export interface IVATAnagraphic {
  id: string
  itemCode: string
  steuerart: string
  fullVatPercentage: number
  reducedVatPercentage: number
}
export interface IEBMAnagraphic {
  id: string
  opsCode: string
  categoryNumber: number
  points: number
  pricePerPoints: number
  description: string
}

export interface IParsedBG {
  id: string
  isCustom: boolean
  debtorNumber: string
  firstName: string
  lastName: string
  address: IAddress
}
export interface ICaseOPItem {
  id: string
  name: string
  price: number
  amount: number
  isMedication: boolean
  isSammelArticle: boolean
  isSachkostenArticle: boolean
  basicPricePerUnit_PublicInsurance: number
  basicPricePerUnit_PrivateInsurance: number
  sammelFactor?: number
  unitOfMeasure?: string
  pzn?: number
  sammelCategory?: string
  supplierNumber?: string
  supplier?: string
}

export interface LightCaseOPItem {
  id: string
  name: string
  basicPricePerUnit_PublicInsurance: number
  basicPricePerUnit_PrivateInsurance: number
}

export interface GOAAnagraphic {
  type: anagraphicsTypes.GOACATA | anagraphicsTypes.GOACATB
  goaNumber: string
  price: number
  description: string
}

export interface ICaseBillingSnapshot {
  createdAt: Date
  updatedAt: Date
  case: Case
  contract: Contract
  goaAnagraphic?: GOAAnagraphic
  caseOPItems: ICaseOPItem[]
  anesthesiaOPItems: ICaseOPItem[]
  externalMaterialPrices: ICaseOPItem[]
  parsedBG?: IParsedBG
  ebmAnagraphic?: IEBMAnagraphic
  vatAnagraphic?: IVATAnagraphic[]
  generalData?: IGeneralData
  missingData?: string[]
  missingItems?: string[]
  tenantId?: string
}

export interface ICaseBillProps {
  missingData?: string[]
  missingItems?: string[]
}

export interface IExtraMaterial {
  materialId: string
  // this will default to the original price, and can be edited only with
  // certain permissions. We keep the original price for an "undo" scenario
  editedPrice: number
  amount: number
}

export interface IExtraCustomCosts {
  costId: string
  name: string
  price: number
  // this field might be used to give an explanation for this cost
  // and it is absolutely optional
  description?: string
  amount?: number
}

export interface IBillObj {
  billObjId: Identifier
  caseId: string
  createdAt: Date
  updatedAt: Date
  type: InvoiceType
  status: InvoiceStatus
  recipient: RecipientType
  dueDate: Date
  totalSum: number
  totalOwed: number
  external: boolean
  debtor: IDebtor
  patient: Partial<Patient>
  extraMaterials: IExtraMaterial[]
  extraCustomCosts: IExtraCustomCosts[]
  positions: ICasePosition[] | ISammelPosition[]
  missingData: string[]
  missingItems: string[]
  elaborationInProgress: boolean
  tenantId?: string
}

export interface ICaseBilling {
  createdAt: Date
  updatedAt: Date
  billId: string // using the numbering system, any config would do
  caseId: string // already in snapshot, but might be useful
  snapshot: ICaseBillingSnapshot
  bills: IBillObj[]
  missingData?: string[]
  missingItems?: string[]
  tenantId?: string
}

export interface ICasePosition {
  date: Date
  abbreviation?: string
  description: string
  amount: number
  price: number
  priceTotal: number
  materialId?: string
  supplierNumber?: string
  vatPosition?: boolean
}

export interface ISammelPosition extends ICasePosition {
  unitOfMeasure: string
  pzn: number | string
  sammelFactor: number
  itemCode: string
  sammelCategory: string
  supplier: string
}

export interface IDebtor {
  title?: string
  firstName?: string
  lastName?: string
  street?: string
  houseNumber?: string
  postalCode?: string
  city?: string
  country?: string
  debtorNumber?: string
  practiceName?: string
  isDoctor?: boolean
}

export interface IGeneratedInvoices {
  invoiceId: Identifier // generated using the official invoice numbering system
  invoiceNumber: string
  creatorId?: string // inserted by the backend
  generatedAt: Date
  recipient: RecipientType
  debtor: IDebtor
  patients?: Partial<Patient>[]
  casesRef: string[]
  type: InvoiceType
  originalInvoiceId?: string
  originalInvoiceNumber?: string
  originalInvoiceType?: InvoiceType
  status: InvoiceStatus
  billObjRefs: string[]
  dueDate: Date
  total: number
  totalOwed: number
  pdfRef?: string
  sammelCheckpointRef?: string
  doctorsIds: string[]
  paid: boolean
  tenantId?: string
  posted: boolean
}

export interface IHidratedGeneratedInvoices {
  invoiceId: Identifier
  invoiceNumber: string
  generatedAt: Date
  recipient: RecipientType
  debtor: IDebtor
  patients?: Partial<Patient>[]
  cases: Case[]
  type: InvoiceType
  originalInvoiceId?: string
  originalInvoiceNumber?: string
  originalInvoiceType?: string
  status: InvoiceStatus
  billObjRefs: string[]
  dueDate: Date
  total: number
  pdfRef?: string
  sammelCheckpoint?: ISammelCheckpoint
  tenantId?: string
  paid: boolean
  posted: boolean
}

export interface IArticleConsumption {
  totalAmount: number
  totalAmountWithPrevious: number
  billingAmount: number
  usedAmount: number
  remainder: number
  description: string
  itemCode: string
}

export interface ISammelCheckpoint {
  createdAt: Date
  doctorId: string
  consumptions: IArticleConsumption[]
  tenantId?: string
}

export interface ICheckUpdatableCasesRequest {
  type: keyof typeof MissingInfo | anagraphicsTypes
  tenantId: string
}

export interface IUpdateCaseRequest {
  type: keyof typeof MissingInfo | anagraphicsTypes
  tenantId: string
  caseId: string
}

export enum Steuerart {
  VOLLER_SATZ = 'VOLLER SATZ',
  ERMÄßIGTER_SATZ = 'ERMÄßIGTER SATZ',
}

export interface InvoicesCasesSnapshot {
  snapshot: ICaseBillingSnapshot
  invoiceId: string
  invoiceType: InvoiceType
  tenantId?: string
}

export interface ParsedSammel {
  materialId: string
  description: string
  total: number
  factor: number
}

export type tCasesBillingFilters = {
  selectedInvoicesTypes: InvoiceType[]
  statusFilters: (CaseStatus | 'OTHERS')[]
  selectedDoctorId: string
  startDate: Date | null
  endDate: Date | null
  page: number
  limit: number
  sortModel: { field: string; sort: 'desc' | 'asc' | null | undefined }[]
}
