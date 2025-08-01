import React from 'react'
import { FormControlLabel, Grid, Checkbox } from '@mui/material'
import { FormikGridAutocomplete, FormikGridSelect } from '../../Commons'
import { BookingDetailTabsEnum, CaseForm, getFullName, IUser, RoomType } from '@smambu/lib.constants'
import { trlb } from 'utilities'
import { FormikProps } from 'formik'
import { hasBillingErrors } from 'utilities/cases-opstandards'

const section = BookingDetailTabsEnum.BOOKING_SECTION

const BookingInformationDetails = ({
  drawerOpen,
  users,
  doctorList,
  canEditBookingDateAndDoctor,
  form,
  errors,
  values,
  touched,
  clearAllFieldsApartPatientTab,
  opStandardsOptions,
  setChangeOpstandardId,
  changeOpstandardInBookingRequest,
  canEditBookingOtherData,
  warningFields,
}: {
  drawerOpen: boolean
  users: Record<string, IUser>
  doctorList: string[]
  canEditBookingDateAndDoctor: boolean
  form: FormikProps<CaseForm>
  errors: Record<string, any>
  values: Record<string, any>
  touched: Record<string, any>
  clearAllFieldsApartPatientTab: () => void
  opStandardsOptions: { value: string; label: string }[]
  setChangeOpstandardId: (opstandardId: string) => void
  changeOpstandardInBookingRequest: (opstandardId: string) => void
  canEditBookingOtherData: boolean
  warningFields?: string[]
}) => {
  const [overnight, setOvernight] = React.useState(Boolean(form.values.bookingSection?.roomType))

  React.useEffect(() => {
    setOvernight(Boolean(form.values.bookingSection?.roomType))
  }, [form.values.bookingSection?.roomType])

  const doctorOptions = React.useMemo(
    () =>
      doctorList.map(id => {
        const user = Object.values(users).find(item => item?.id === id)
        return { value: id, label: getFullName(user, true) }
      }),
    [users, doctorList],
  )

  const opStandardHelperText = React.useMemo(() => {
    if (opStandardsOptions.length === 0) return trlb('noResultFromCombination')
    return touched?.opStandardId ? errors?.opStandardId : null
  }, [opStandardsOptions, touched, errors])

  const roomTypes = React.useMemo(
    () =>
      Object.values(RoomType).map(el => ({
        value: el,
        label: trlb(el),
      })),
    [],
  )

  const onOpstandardChange = (_e: any, option: { label: string; value: string }) => {
    if (form.values.caseNumber !== '') setChangeOpstandardId(option?.value)
    else changeOpstandardInBookingRequest(option?.value)
  }

  const necessaryForBuildingLabel = trlb('case_tab_billing_field_necessary_for_billing')
  const formBookingOpstandardWarning = hasBillingErrors(warningFields, `${section}.opStandardId`, true) ? necessaryForBuildingLabel : ''

  const disableDoctorChange = !canEditBookingDateAndDoctor ||
    doctorList.length === 1 ||
    form.values.caseNumber !== ''

  return (
    <Grid item xl={7} lg={drawerOpen ? 12 : 7} md={12}>
      <Grid container spacing={2}>
        <FormikGridAutocomplete
          searchIcon={undefined}
          xs={12}
          label={trlb('formBooking_Doctor')}
          options={doctorOptions}
          disabled={disableDoctorChange}
          form={form}
          section={section}
          errors={errors}
          values={values}
          touched={touched}
          name='doctorId'
          onSelectValue={(_e, option) => {
            if (option?.value !== values.doctorId) {
              clearAllFieldsApartPatientTab()
              form.setFieldValue(section + '.opStandardId', '')
              form.setFieldValue(section + '.doctorId', option?.value)
            }
          }}
        />
        <FormikGridAutocomplete
          searchIcon={undefined}
          xs={12}
          label={trlb('formBooking_OpStandard')}
          options={opStandardsOptions}
          disabled={!canEditBookingDateAndDoctor}
          form={form}
          section={section}
          errors={errors}
          values={values}
          touched={touched}
          name='opStandardId'
          helperText={opStandardHelperText}
          disableClearable
          onSelectValue={onOpstandardChange}
          warning={formBookingOpstandardWarning}
        />
        <Grid item xs={4}>
          <FormControlLabel
            control={<Checkbox checked={overnight} disabled={!canEditBookingOtherData} />}
            label={trlb('formBooking_overnight')}
            onChange={() => {
              if (overnight) form.setFieldValue(section + '.roomType', null)
              setOvernight(prev => !prev)
            }}
          />
        </Grid>
        {overnight && (
          <FormikGridSelect
            label={trlb('formBooking_roomType')}
            menuItems={roomTypes}
            xs={8}
            disabled={!canEditBookingOtherData}
            form={form}
            section={section}
            errors={errors}
            values={values}
            touched={touched}
            name='roomType'
          />
        )}
      </Grid>
    </Grid>
  )
}

export default BookingInformationDetails
