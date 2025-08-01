import React from 'react'
import { Box } from '@mui/material'
import { FormikGridTextField, Panel, SectionTitle, Space20, Space40 } from 'components/Commons'
import { BookingNotesFormFields } from 'components/Forms'
import { trlb } from 'utilities'
import { FormikProps } from 'formik'
import {
  BookingDetailTabsEnum,
  CaseForm,
  permissionRequests,
} from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import { DocumentsSection } from 'components/DocumentsSection'
import { useAppSelector } from 'store'
import BookingInformationFormFields from 'components/BookingInformationFormFields/BookingInformationFormFields'

interface BookingInformationTabProps {
  canEditBookingDateAndDoctor: boolean
  canEditBookingOtherData: boolean
  form: FormikProps<CaseForm>
  warningFields?: string[]
}

const BookingInformationTab = ({
  canEditBookingDateAndDoctor,
  canEditBookingOtherData,
  form,
  warningFields,
}: BookingInformationTabProps) => {
  const drawerOpen = useAppSelector(state => state.global.drawerOpen)

  const checkPermission = useGetCheckPermission()
  const canViewDocuments = checkPermission(permissionRequests.canViewDocuments)
  const canDownloadDocuments = checkPermission(permissionRequests.canDownloadDocuments)
  const userCanUploadDocuments = checkPermission(permissionRequests.canUploadDocuments)
  const canViewBookingNotes = checkPermission(permissionRequests.canViewBookingNotes)
  const canEditBookingNotes = checkPermission(permissionRequests.canEditBookingNotes)

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
          canEditBookingDateAndDoctor={canEditBookingDateAndDoctor}
          canEditBookingOtherData={canEditBookingOtherData}
          form={form}
          values={form.values.bookingSection}
          errors={form.errors.bookingSection as Record<string, string>}
          touched={form.touched.bookingSection as Record<string, boolean>}
          setOutsideDoctorSlots={() => {}}
          warningFields={warningFields}
          drawerOpen={drawerOpen}
        />
      </Panel>
      <Space20 />
      {form.values.confirmationNote && (
        <>
          <SectionTitle text={trlb('confirmation_note')} />
          <Panel>
            <FormikGridTextField
              label={trlb('confirmation_note')}
              xs={12}
              multiline
              fullWidth
              disabled
              form={form}
              section=''
              errors={form.errors}
              values={form.values}
              touched={form.touched}
              name='confirmationNote'
            />
          </Panel>
        </>
      )}
      {canViewBookingNotes && (
        <>
          <SectionTitle text={trlb('bookingRequest_bookingNotes')} />
          <Panel>
            <BookingNotesFormFields
              readOnly={!canEditBookingDateAndDoctor || !canEditBookingNotes}
              form={form}
              values={form.values.notesSection}
              errors={form.errors.notesSection}
              touched={form.touched.notesSection}
              section={BookingDetailTabsEnum.NOTES_SECTION}
            />
          </Panel>
        </>
      )}
      <Space40 />
      {canViewDocuments && (
        <DocumentsSection
          form={form}
          uploadsField='uploads'
          documentsToUploadField='documentsToUpload'
          edit={canEditBookingDateAndDoctor && userCanUploadDocuments}
          canDownloadDocuments={canDownloadDocuments}
          canViewDocuments={canViewDocuments}
        />
      )}
    </Box>
  )
}

export default BookingInformationTab
