import * as yup from 'yup'
import { trlb } from 'utilities/translator/translator'
import {
  OpStandardBodyRegion_Name,
  OpStandardFeet_Name,
  OpStandardFinger_Name,
  OpStandardPosition_Name,
  OpStandardSpinalSegment_Name,
  OpStandardTeeth,
  phoneRegex,
  validateEmail,
} from '@smambu/lib.constants'
import { isValid } from 'date-fns'

export const patientValidationSchema = yup.object().shape({
  title: yup.string().optional(),
  name: yup.string().required(trlb('commons_required')),
  surname: yup.string().required(trlb('commons_required')),
  birthDate: yup
    .date()
    .typeError(trlb('date_invalid_error'))
    .required(trlb('commons_required'))
    .max(new Date(), trlb('dateTime_future_date_not_enabled')),
  gender: yup.string().required(trlb('commons_required')),
  genderBirth: yup.string().required(trlb('commons_required')),
  nationality: yup.string(),
  phoneNumber: yup.string().optional()
    .matches(phoneRegex, trlb('commons_phoneNotValid')),
  email: yup
    .string()
    .optional()
    .test('emailVerification', trlb('commons_emailNotValid'), value => {
      return (value && validateEmail(value)) || !value
    }),
  address: yup
    .object({
      street: yup.string().required(trlb('commons_required')),
      houseNumber: yup.string().required(trlb('commons_required')),
      postalCode: yup.string().required(trlb('commons_required')),
      city: yup.string().required(trlb('commons_required')),
      country: yup.string().required(trlb('commons_required')),
    })
    .required(),
})

export const bookingValidationSchema = yup.object().shape(
  {
    date: yup
      .date()
      .required(trlb('commons_required'))
      .typeError(trlb('commons_invalid_date'))
      .when(['_maxDate', '_minDate'], {
        is: (maxdate: Date, minDate: Date) => isValid(maxdate) && isValid(minDate),
        then: Schema =>
          Schema.required(trlb('commons_required'))
            .typeError(trlb('commons_invalid_date'))
            .min(yup.ref('_minDate'), () => `${trlb('bookingTab_minDateErrorMessage')})}`)
            .max(yup.ref('_maxDate'), () => `${trlb('bookingTab_maxDateErrorMessage')}}`),
      }),
    _minDate: yup.date().nullable(),
    _maxDate: yup.date().nullable(),
    doctorId: yup.string().required(trlb('commons_required')),
    contractId: yup.string().required(trlb('commons_required')),
    opStandardId: yup.string().required(trlb('commons_required')),
    overnight: yup.boolean(),
    roomType: yup
      .string()
      .nullable()
      .when('overnight', {
        is: true,
        then: Schema => Schema.required(trlb('commons_required')),
      }),
  },
)

export const notesValidationSchema = yup.object().shape({
  notes: yup.string().nullable(),
})

export const surgeryValidationSchema = yup.object().shape({
  side: yup
    .string()
    .nullable()
    .when('_sideRequired', {
      is: true,
      then: Schema => Schema.required(trlb('commons_required')),
    }),
  _sideRequired: yup.boolean(),
  _surgeryBodyLocationsRequired: yup.boolean(),
  _preferredAnesthesiaRequired: yup.boolean(),
  preferredAnesthesia: yup.string().nullable(),
  // This commenting is temporary, until we can decide what we want to do with the preferredAnesthesia field
  // .when('_preferredAnesthesiaRequired', {
  //   is: true,
  //   then: Schema => Schema.required(trlb('commons_required')),
  // }),
  positions: yup
    .array()
    .of(yup.mixed<OpStandardPosition_Name>().oneOf(Object.values(OpStandardPosition_Name)))
    .min(1, trlb('booking_tab_surgery_at_least_one_position_required'))
    .required(trlb('commons_required')),
  surgeryBodyLocations: yup
    .array()
    .nullable()
    .when('_surgeryBodyLocationsRequired', {
      is: true,
      then: Schema =>
        Schema.of(
          yup
            .mixed<
              | OpStandardBodyRegion_Name
              | OpStandardSpinalSegment_Name
              | OpStandardFinger_Name
              | number
              | OpStandardFeet_Name
          >()
            .oneOf([
              ...Object.values(OpStandardBodyRegion_Name),
              ...Object.values(OpStandardSpinalSegment_Name),
              ...Object.values(OpStandardFinger_Name),
              ...Object.values(OpStandardFeet_Name),
              ...OpStandardTeeth.keys(),
            ]),
        )
          .min(1, trlb('booking_tab_surgery_at_least_one_body_region_required'))
          .required(trlb('commons_required')),
    }),
})
