import { CaseInstruction, CaseOpStandardMaterial, CaseOpStandardMedication } from '@smambu/lib.constants'
import { FormikProps } from 'formik'
import { getFieldError, getFieldTouched } from './form'
import _ from 'lodash'

const WARNABLE_FIELDS = ['amount']

const anyMaterialsIsEmpty = (materialsArray: CaseOpStandardMaterial[] |
  CaseOpStandardMedication[]) => {
  return materialsArray?.some(current => current.amount === 0)
}

const anyMandatoryInstructionMissing = (instructions: CaseInstruction[]) => {
  return instructions.some(({ mandatory, checked }) => mandatory && !checked)
}

export const OPSectionIsValid = (form: FormikProps<any>,
  section: string,
  isSubsection: boolean = false): boolean => {
  const sectionErrors = _.get(form.errors, section)
  const sectionValues = _.get(form.values, section)

  const hasErrors = sectionErrors !== undefined

  if (sectionValues != null && Object.keys(sectionValues).length > 0) {
    const instructions = isSubsection ? sectionValues : sectionValues.instructions
    const materials = isSubsection ? sectionValues : sectionValues.materials
    const medications = isSubsection ? sectionValues : sectionValues.medications

    const instructionsNeeded = instructions !== undefined

    const instructionMissing = instructionsNeeded
      ? anyMandatoryInstructionMissing(instructions)
      : false
    const anyMaterialEmpty = anyMaterialsIsEmpty(materials)
    const anyMedicationsEmpty = anyMaterialsIsEmpty(medications)

    return !hasErrors && !instructionMissing && !anyMaterialEmpty && !anyMedicationsEmpty
  }

  return !hasErrors
}

export const getFormFieldErrors = (form: FormikProps<any>, fieldPath: string) => {
  const fieldWasTouched = !!getFieldTouched(form, fieldPath)
  const fieldError = getFieldError(form, fieldPath) as string
  const fieldHasError = fieldError != null && fieldError !== ''

  return fieldWasTouched && fieldHasError ? fieldError : undefined
}

export const caseIntraOpIsValid = (form: FormikProps<any>): boolean => {
  const glovesIsValid = OPSectionIsValid(form, 'intraOpSection.gloves')
  const positioningToolsIsValid = OPSectionIsValid(form, 'intraOpSection.positioningTools')
  const equipmentIsValid = OPSectionIsValid(form, 'intraOpSection.equipment')
  const disinfectionIsValid = OPSectionIsValid(form, 'intraOpSection.disinfection')
  const coveringIsValid = OPSectionIsValid(form, 'intraOpSection.covering')
  const surgicalInstrumentsIsValid = OPSectionIsValid(form, 'intraOpSection.surgicalInstruments')
  const disposableMaterialIsValid = OPSectionIsValid(form, 'intraOpSection.disposableMaterial')
  const sutureMaterialIsValid = OPSectionIsValid(form, 'intraOpSection.sutureMaterial')
  const medication_rinseIsValid = OPSectionIsValid(form, 'intraOpSection.medication_rinse')
  const extrasIsValid = OPSectionIsValid(form, 'intraOpSection.extras')
  const particularitiesIsValid = OPSectionIsValid(form, 'intraOpSection.particularities')

  return glovesIsValid &&
    positioningToolsIsValid &&
    equipmentIsValid &&
    disinfectionIsValid &&
    coveringIsValid &&
    surgicalInstrumentsIsValid &&
    disposableMaterialIsValid &&
    sutureMaterialIsValid &&
    medication_rinseIsValid &&
    extrasIsValid &&
    particularitiesIsValid
}

// XXX this should be fixed everywhere to use an empty array instead, since it
// is actually the default value anyway. There are too many ? and messed types
// to do this as a part of an another issue
export const hasBillingErrors = (warningFields: string[] | undefined,
  searchTerm: string,
  matchExact: boolean): boolean => {
  if (warningFields === undefined) return false

  if (matchExact)
    return warningFields.includes(searchTerm)

  return warningFields?.some(field => field.startsWith(searchTerm))
}

export const isWarnableField = (field: string) => WARNABLE_FIELDS.includes(field)

// types are a mess right now!
export const getColumnFieldHelperText = (column: any, row: any, fieldError: string | undefined) => {
  const columnError = column.getHelperText?.(row)

  if (columnError !== undefined && columnError !== '')
    return columnError

  const fieldHasError = fieldError !== undefined && fieldError !== ''

  if (fieldHasError) return fieldError

  // XXX this is done for an aligment problem of mui helper text - it is actually
  // an official practice, not a workaround.
  return ' '
}

export const getColumnFieldHasError = (column: any, row: any, fieldError: string | undefined) => {
  const columnError = column.getError?.(row)

  if (columnError !== undefined && columnError !== '')
    return columnError

  const fieldHasError = fieldError !== undefined && fieldError !== ''

  if (fieldHasError) return fieldError
}

export const getColumnFieldIsDisabled = (column: any, row: any, edit: boolean) => {
  if (column.disabled) return true

  const getDisabledFun = column.getDisabled
  const hasDisabledFunction = typeof getDisabledFun === 'function'

  if (hasDisabledFunction) {
    const columnDisabled = getDisabledFun(row)

    if (columnDisabled) return true
  }

  return !edit
}

export const getItemId = (currentItem: any) => {
  const materialId = currentItem?.materialId
  const medicationId = currentItem?.medicationId
  const sterileGood = currentItem?.sterileGood
  const name = currentItem?.name
  const id = currentItem?.id

  if (materialId !== undefined && materialId !== '') return materialId
  if (medicationId !== undefined && medicationId !== '') return medicationId
  if (sterileGood !== undefined && sterileGood !== '') return sterileGood
  if (name !== undefined && name !== '') return name
  if (id !== undefined && id !== '') return id

  throw new Error(`Item ${currentItem} has no viable Id`)
}
