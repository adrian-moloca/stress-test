import {
  Contract,
  ContractDetail,
  SurgerySlot,
} from '@smambu/lib.constants'
import * as yup from 'yup'

yup.addMethod(yup.number as any, 'numberRequiredIf', function (list, message) {
  return this.test('requiredIf', message, function (value: any) {
    const { path, createError } = this

    // check if any in list contain value
    // true : one or more are contains a value
    // false: none contain a value
    let anyHasValue = list.some((value: any) => {
      // return `true` if value is not empty, return `false` if value is empty
      return !document.querySelector(`input[name="${value}"]`)?.value
    })

    // returns `CreateError` current value is empty and no value is found, returns `false` if current value is not empty and one other field is not empty.
    return !value && !anyHasValue ? createError({ path, message: message ?? 'commons_required' }) : true
  })
})

export const contractValidationSchema = yup.object<Omit<Contract, 'id'>>().shape({
  details: yup
    .object<ContractDetail>()
    .shape({
      contractName: yup.string().required('commons_required'),
      doctorId: yup.string().required('commons_required'),
      kassenzulassung: yup.boolean().required('commons_required'),
      validFrom: yup
        .date()
        .typeError('commons_invalid_date')
        .required('commons_required')
        .max(yup.ref('validUntil'), 'commons_invalid_date'),
      validUntil: yup
        .date()
        .typeError('commons_invalid_date')
        .required('commons_required')
        .min(yup.ref('validFrom'), 'commons_invalid_date'),
      overnightStayFee1Bed: yup.number().default(undefined),
      overnightStayFee2Bed: yup.number().default(undefined),
      overnightStayFee3Bed: yup.number().default(undefined),
      surgerySlots: yup.array().of(
        yup.object<SurgerySlot>().shape({
          from: yup.date().required('commons_required'),
          to: yup.date().required('commons_required'),
        }),
      ),
    })
    .required('commons_required'),
})
