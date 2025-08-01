import React from 'react'
import { Typography, Grid } from '@mui/material'
import {
  Space20,
  GridTextField,
  FormikGridTextField,
  FormikGridSelect,
  FormikGridInlineDatePicker,
  Panel,
} from './Commons'
import {
  Gender_Name,
} from '@smambu/lib.constants'
import { trlb } from 'utilities'
import { isValid, isSameDay } from 'date-fns'
import { getFormFieldErrors, hasBillingErrors } from 'utilities/cases-opstandards'

interface FormProps {
  readOnly: boolean
  form: any
  section?: string
  warningFields?: string[]
  compareValues?: any
}

export const AddressFormFields = ({ readOnly, form, section = 'address', warningFields, compareValues }: FormProps) => {
  const getHelperText = (name: string) =>
    compareValues !== undefined && compareValues?.[name] !== form.getFieldProps(`${section}.${name}`).value
      ? {
        helperText: trlb('addressForm_fieldChanged'),
        FormHelperTextProps: { disabled: false, sx: { color: 'error.main' } },
      }
      : {}

  const necessaryForBuildingLabel = trlb('case_tab_billing_field_necessary_for_billing')

  const street = `${section}.street`
  const addressFormStreetWarning = hasBillingErrors(warningFields, street, true) ? necessaryForBuildingLabel : ''
  const addressFormStreetError = getFormFieldErrors(form, street)

  const houseNumber = `${section}.houseNumber`
  const addressFormHouseNumberWarning = hasBillingErrors(warningFields, houseNumber, true) ? necessaryForBuildingLabel : ''
  const addressFormHouseNumberError = getFormFieldErrors(form, houseNumber)

  const postalCode = `${section}.postalCode`
  const addressFormPostalCodeWarning = hasBillingErrors(warningFields, postalCode, true) ? necessaryForBuildingLabel : ''
  const addressFormPostalCodeError = getFormFieldErrors(form, postalCode)

  const city = `${section}.city`
  const addressFormCityWarning = hasBillingErrors(warningFields, city, true) ? necessaryForBuildingLabel : ''
  const addressFormCityError = getFormFieldErrors(form, city)

  const country = `${section}.country`
  const addressFormCountryWarning = hasBillingErrors(warningFields, country, true) ? necessaryForBuildingLabel : ''
  const addressFormCountryError = getFormFieldErrors(form, country)

  return (
    <>
      <GridTextField
        label={trlb('addressForm_Street')}
        xs={8}
        disabled={readOnly}
        {...form.getFieldProps(street)}
        error={addressFormStreetError}
        warning={addressFormStreetWarning}
        {...getHelperText('street')}
      />
      <GridTextField
        label={trlb('addressForm_HouseNumber')}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps(houseNumber)}
        error={addressFormHouseNumberError}
        warning={addressFormHouseNumberWarning}
        {...getHelperText('houseNumber')}
      />
      <GridTextField
        label={trlb('addressForm_PostalCode')}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps(postalCode)}
        error={addressFormPostalCodeError}
        warning={addressFormPostalCodeWarning}
        {...getHelperText('postalCode')}
      />
      <GridTextField
        label={trlb('addressForm_City')}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps(city)}
        error={addressFormCityError}
        warning={addressFormCityWarning}
        {...getHelperText('city')}
      />
      <GridTextField
        label={trlb('addressForm_Country')}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps(country)}
        error={addressFormCountryError}
        warning={addressFormCountryWarning}
        {...getHelperText('country')}
      />
    </>
  )
}

export const BookingNotesFormFields = ({ readOnly, form, values, errors, touched, section }) => {
  return (
    <Grid>
      <FormikGridTextField
        label={trlb('formBooking_Notes')}
        xs={12}
        multiline
        rows={4}
        fullWidth
        {...{
          disabled: readOnly,
          form,
          section,
          errors,
          values,
          touched,
          name: 'notes',
        }}
      />
    </Grid>
  )
}

export const PatientInformationFormFields = ({
  readOnly,
  form,
  values,
  errors,
  touched,
  section,
  warningFields,
  compareValues,
}: {
  readOnly: boolean
  form: any
  values: any
  errors: any
  touched: any
  section: string
  warningFields?: any
  compareValues?: any
}) => {
  const otherGender = values?.gender === Gender_Name.OTHER

  const getHelperText = (name: string, type?: 'date') => {
    if (compareValues == null) return {}

    const warning = {
      helperText: trlb('patientForm_fieldChanged'),
      FormHelperTextProps: { disabled: false, sx: { color: 'error.main' } },
    }

    switch (type) {
      case 'date':
        return isValid(new Date(compareValues?.[name])) &&
          isValid(new Date(values[name])) &&
          isSameDay(compareValues?.[name], values[name])
          ? {}
          : warning
      default:
        return compareValues?.[name] !== values[name] ? warning : {}
    }
  }

  const necessaryForBuildingLabel = trlb('case_tab_billing_field_necessary_for_billing')
  const patientFormNameWarning = hasBillingErrors(warningFields, `${section}.name`, true) ? necessaryForBuildingLabel : ''
  const patientFormSurnameWarning = hasBillingErrors(warningFields, `${section}.surname`, true) ? necessaryForBuildingLabel : ''
  const patientFormDebtorNumberWarning = hasBillingErrors(warningFields, `${section}.debtorNumber`, true) ? necessaryForBuildingLabel : ''
  const patientFormBirthDateWarning = hasBillingErrors(warningFields, `${section}.birthDate`, true) ? necessaryForBuildingLabel : ''

  return (
    <Grid container sx={{ justifyContent: 'center' }} spacing={2}>
      <Grid item md={12} lg={6}>
        <Panel>
          <Grid container spacing={2}>
            <FormikGridTextField
              label={trlb('patientForm_Title')}
              xs={4}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'title',
                ...getHelperText('title'),
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_Name')}
              xs={8}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'name',
                ...getHelperText('name'),
                warning: patientFormNameWarning,
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_PatientNumber')}
              xs={4}
              {...{
                disabled: true,
                form,
                section,
                errors,
                values,
                touched,
                name: 'patientNumber',
                ...getHelperText('patientNumber'),
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_Surname')}
              xs={8}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'surname',
                ...getHelperText('surname'),
                warning: patientFormSurnameWarning,
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_DebtorNumber')}
              xs={4}
              {...{
                disabled: true,
                form,
                section,
                errors,
                values,
                touched,
                name: 'debtorNumber',
                ...getHelperText('debtorNumber'),
                warning: patientFormDebtorNumberWarning,
              }}
            />
          </Grid>
        </Panel>
      </Grid>
      <Grid item md={12} lg={6}>
        <Panel>
          <Grid container spacing={2}>
            <FormikGridInlineDatePicker
              label={trlb('patientForm_Birthdate')}
              xs={otherGender ? 4 : 6}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'birthDate',
                warning: patientFormBirthDateWarning,
                ...getHelperText('birthDate', 'date'),
              }}
            />
            <FormikGridSelect
              label={trlb('patientForm_Gender')}
              xs={otherGender ? 4 : 6}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'gender',
                menuItems: Object.values(Gender_Name).map(el => ({
                  value: el,
                  label: el,
                })),
                ...getHelperText('gender'),
              }}
            />
            {otherGender
              ? (
                <FormikGridTextField
                  label={trlb('patientForm_GenderSpecifics')}
                  xs={otherGender ? 4 : 6}
                  {...{
                    disabled: readOnly,
                    form,
                    section,
                    errors,
                    values,
                    touched,
                    name: 'genderSpecifics',
                    ...getHelperText('genderSpecifics'),
                  }}
                />
              )
              : null}
            <FormikGridTextField
              label={trlb('patientForm_Nationality')}
              xs={6}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'nationality',
                ...getHelperText('nationality'),
              }}
            />
            <FormikGridSelect
              label={trlb('patientForm_BirthGender')}
              xs={6}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'genderBirth',
                menuItems: Object.values(Gender_Name)
                  .filter(gender => gender !== Gender_Name.OTHER)
                  .map(el => ({ value: el, label: el })),
                ...getHelperText('genderBirth'),
              }}
            />
          </Grid>
        </Panel>
      </Grid>
      <Grid item md={12} lg={6}>
        <Typography variant='subtitle1' sx={{ width: '100%', textAlign: 'center' }}>
          {trlb('patientForm_Contacts')}
        </Typography>
        <Space20 />
        <Panel>
          <Grid container spacing={2}>
            <FormikGridTextField
              label={trlb('patientForm_PhoneNumber')}
              xs={6}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'phoneNumber',
                ...getHelperText('phoneNumber'),
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_Email')}
              xs={6}
              {...{
                disabled: readOnly,
                form,
                section,
                errors,
                values,
                touched,
                name: 'email',
                ...getHelperText('email'),
              }}
            />
          </Grid>
        </Panel>
      </Grid>
      <Grid item md={12} lg={6}>
        <Typography variant='subtitle1' sx={{ width: '100%', textAlign: 'center' }}>
          {trlb('patientForm_Address')}
        </Typography>
        <Space20 />
        <Panel>
          <Grid container spacing={2}>
            <AddressFormFields
              {...{
                readOnly,
                warningFields,
                section: section ? section + '.address' : undefined,
                form,
                compareValues: compareValues?.address,
              }}
            />
          </Grid>
        </Panel>
      </Grid>
    </Grid>
  )
}
