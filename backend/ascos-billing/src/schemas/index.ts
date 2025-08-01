import { CaseBilling, CaseBillingSchema } from './casebilling.schema'
import { BillsObj, BillsObjSchema } from './billsObj.schema'
import { CaseBillingSnapshot, CaseBillingSnapshotSchema } from './casebillingsnapshot.schema'
import { GeneratedInvoice, GeneratedInvoiceSchema } from './generatedInvoice.schema'
import { PcMaterial, PcMaterialSchema } from './pcMaterial.schema'
import { SammelCheckpoint, SammelCheckpointSchema } from './sammelCheckpoint.schema'
import { InvoicesCasesSnapshot, InvoicesCasesSnapshotSchema } from './invoiceCasesSnapshots'
import { InvoicesPdfsArchive, InvoicesPdfsArchiveSchema } from './invoicesPdfsArchive.schema'
import { Prescription, PrescriptionSchema } from './prescriptions.schema'
import { PrescriptionSnapshot, PrescriptionSnapshotSchema } from './prescriptionSnapshot.schema'

export default [
  {
    name: CaseBilling.name,
    schema: CaseBillingSchema,
  },
  {
    name: BillsObj.name,
    schema: BillsObjSchema,
  },
  {
    name: CaseBillingSnapshot.name,
    schema: CaseBillingSnapshotSchema,
  },
  {
    name: GeneratedInvoice.name,
    schema: GeneratedInvoiceSchema,
  },
  {
    name: SammelCheckpoint.name,
    schema: SammelCheckpointSchema,
  },
  {
    name: InvoicesCasesSnapshot.name,
    schema: InvoicesCasesSnapshotSchema,
  },
  {
    name: InvoicesPdfsArchive.name,
    schema: InvoicesPdfsArchiveSchema
  },
  {
    name: PcMaterial.name,
    schema: PcMaterialSchema
  },
  {
    name: Prescription.name,
    schema: PrescriptionSchema
  },
  {
    name: PrescriptionSnapshot.name,
    schema: PrescriptionSnapshotSchema,
  }
]
