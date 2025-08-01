import { tStringType, tTranslatableString } from '../base-types'
import { tBillableCondition } from '../billing-config'
import { tCondition, tExpression, tTypedExpression } from '../expressions'
import { tFragmentValues } from './fragment-values'
import { tInvoiceValues } from './invoice-values'

// TODO: note for the future: this should be probably renamed in "DocRendered"
// or something like this, to better illustrate its real function
export type tRenderer = {
  kind: 'legacyRenderer'
  // TODO: note for the future: this will and must be evaluated with "this" scoped
  // as "invoice values"
  groupBy: tExpression[]
}

export type tDocumentTypes = {
  id: string
  name: tTranslatableString
  description: tTranslatableString
  condition: tCondition
  renderer: tRenderer
  // TODO: Problem for the future: we might need to implement a "write time"
  // check to avoid writing keys in the "groupBy" expression which are not
  // present in the "fragmentValues" keys
  // This must also be applied to the "invoiceValues" keys
  groupBy: tTypedExpression<tStringType>[]
  fragmentValues: tFragmentValues
  invoiceValues: tInvoiceValues
  fragmentBillableCondition: tBillableCondition[]
}
