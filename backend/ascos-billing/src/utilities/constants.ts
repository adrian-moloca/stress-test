import { Case, Contract, IUser, OpStandard } from '@smambu/lib.constantsjs'
import { BillsObjDocument } from 'src/schemas/billsObj.schema'
import { GeneratedInvoiceDocument } from 'src/schemas/generatedInvoice.schema'

export const NAMES = {
  BillsQueue: 'BillsQueue',
  AnalyzeQueue: 'AnalyzeQueue',
  NormalizerQueue: 'NormalizerQueue',
  PDFArchivesQueue: 'PDFArchivesQueue',
  PDFArchivesToDelete: 'PDFArchivesToDelete'
} as const

export const attempts = 1

export const queueRetry = () => ({
  attempts: parseInt(process.env.CRON_RETRY_ATTEMPTS),
  backoff: {
    type: 'exponential',
    delay: parseInt(process.env.CRON_RETRY_DELAY),
  },
})

export interface INormalizerJob {
  type: string
  payload?: Case | OpStandard | IUser | BillsObjDocument | GeneratedInvoiceDocument | Contract
}

export const NORMALIZE_OPERATIONS = {
  CASES_WITHOUT_ANESTHESIOLOGIST_PRESENCE: 'CASES_WITHOUT_ANESTHESIOLOGIST_PRESENCE',
  USERS_WITH_PASSWORD: 'USERS_WITH_PASSWORD',
  CASES_WITHOUT_DOCTOR: 'CASES_WITHOUT_DOCTOR',
  CASES_WITHOUT_CONTRACT_SNAPSHOT: 'CASES_WITHOUT_CONTRACT_SNAPSHOT',
  CASES_WITH_BOOKING_DATE_OF_TYPE_STRING: 'CASES_WITH_BOOKING_DATE_OF_TYPE_STRING',
  CASES_WITHOUT_OPSTANDARDS_ARRAY: 'CASES_WITHOUT_OPSTANDARDS_ARRAY',
  CASES_WITH_MORE_THAN_ONE_OP: 'CASES_WITH_MORE_THAN_ONE_OP',
  CASES_WITHOUT_NEEDED_INVOICE_TYPES: 'CASES_WITHOUT_NEEDED_INVOICE_TYPES',
  CASES_WITHOUT_MISSING_INFO: 'CASES_WITHOUT_MISSING_INFO',
  CASES_WITHOUT_BILLING_CATEGORY: 'CASES_WITHOUT_BILLING_CATEGORY',
}
