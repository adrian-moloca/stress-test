import React from 'react'
import { BookingDetailTabsEnum, CaseForm } from '@smambu/lib.constants'
import { Box } from '@mui/material'
import { SectionTitle, Panel, Space20, Space40 } from 'components/Commons'
import { BookingNotesFormFields } from 'components/Forms'
import { FormikProps } from 'formik'
import { trlb } from 'utilities'
import { useAppSelector } from 'store'
import BookingInformationFormFields from 'components/BookingInformationFormFields/BookingInformationFormFields'

const BookingInformationTab = ({
  edit,
  form,
  setOutsideDoctorSlots,
}: {
  edit: boolean
  form: FormikProps<CaseForm>
  setOutsideDoctorSlots: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const drawerOpen = useAppSelector(state => state.global.drawerOpen)

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <SectionTitle text={trlb('bookingRequest_bookingInformation')} />
      <Panel>
        <BookingInformationFormFields
          canEditBookingDateAndDoctor={edit}
          canEditBookingOtherData={edit}
          form={form}
          values={form.values.bookingSection}
          errors={form.errors.bookingSection as Record<string, string>}
          touched={form.touched.bookingSection as Record<string, boolean>}
          setOutsideDoctorSlots={setOutsideDoctorSlots}
          drawerOpen={drawerOpen}
        />
      </Panel>
      <Space20 />
      <SectionTitle text={trlb('bookingRequest_bookingNotes')} />
      <Panel>
        <BookingNotesFormFields
          readOnly={!edit}
          form={form}
          values={form.values.notesSection}
          errors={form.errors.notesSection}
          touched={form.touched.notesSection}
          section={BookingDetailTabsEnum.NOTES_SECTION}
        />
      </Panel>
      <Space40 />
    </Box>
  )
}

export default BookingInformationTab
