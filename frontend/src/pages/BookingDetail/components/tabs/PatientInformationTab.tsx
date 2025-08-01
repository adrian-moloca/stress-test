import React from 'react'
import { BookingDetailTabsEnum, CaseForm } from '@smambu/lib.constants'
import { Box } from '@mui/material'
import { SectionTitle } from 'components/Commons'
import { PatientInformationFormFields } from 'components/Forms'
import { FormikProps } from 'formik'
import { trlb } from 'utilities'

const PatientInformationTab = ({
  edit,
  form,
}: {
  edit: boolean
  form: FormikProps<CaseForm>
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <SectionTitle text={trlb('booking_tab_patient')} />
      <PatientInformationFormFields
        readOnly={!edit}
        form={form}
        values={form.values.bookingPatient}
        errors={form.errors.bookingPatient}
        touched={form.touched.bookingPatient}
        section={BookingDetailTabsEnum.BOOKING_PATIENT}
      />
    </Box>
  )
}

export default PatientInformationTab
