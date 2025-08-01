import { CaseForm, OpStandard } from '@smambu/lib.constants'
import { FormikProps } from 'formik'
import * as _ from 'lodash'

export const getFieldValue = (form: any, fieldName: string) => {
  return _.get(form.values, fieldName)
}

export const getFieldError = (form: any, fieldName: string) => {
  return _.get(form.errors, fieldName)
}

export const getFieldTouched = (form: any, fieldName: string) => {
  return _.get(form.touched, fieldName)
}

export const getFieldFormPath = (formPath: string, field: string, index: number) => `${formPath}[${index}].${field}`

export const checkCaseRequiredFields = (form: FormikProps<CaseForm>, opStandard: OpStandard) => {
  form.setFieldValue('surgerySection._sideRequired', opStandard.bookingSection.sideRequired)
  form.setFieldValue('surgerySection._surgeryBodyLocationsRequired', opStandard.bookingSection.bodyRegions.length > 0)
  form.setFieldValue('surgerySection._preferredAnesthesiaRequired', opStandard.bookingSection.anesthesiaList.length > 0)
}
