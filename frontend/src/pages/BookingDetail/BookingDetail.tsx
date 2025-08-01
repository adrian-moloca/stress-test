import React, { useEffect, useRef, useState } from 'react'
import { Box, Tabs, Tab, Card } from '@mui/material'
import { PageContainer, PageHeader } from 'components/Commons'
import { SaveButton } from 'components/Buttons'
import { trlb } from 'utilities/translator/translator'
import { CheckCircle } from '@mui/icons-material'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { routes } from 'routes/routes'
import { CaseForm, formatCaseForm, permissionRequests, IUser } from '@smambu/lib.constants'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateBookingRequest } from 'hooks'
import {
  patientValidationSchema,
  bookingValidationSchema,
  notesValidationSchema,
  surgeryValidationSchema,
} from './validationSchemas'
import { PatientInformationTab, BookingInformationTab, SurgeryDetailsTab, DocumentsTab } from './components/tabs'
import { useImportDoctorstIntoState } from 'hooks/userHooks'
import { useImportContractsByDoctorIdIntoState } from 'hooks/contractHooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import ConfirmSaveModal from './components/ConfirmSave'
import SaveModal from './components/SaveModal'
import { useAppSelector } from 'store'
import { defaultStyles } from 'ThemeProvider'
import { WarningIcon } from 'components/Icons'

export const bookingInitialValues = formatCaseForm({})
const BookingRequest = () => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const checkPermission = useGetCheckPermission()
  const [outsideDoctorSlots, setOutsideDoctorSlots] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [searchParams] = useSearchParams()
  const [openSave, setOpenSave] = useState(false)
  const createBookingRequest = useCreateBookingRequest()
  const passedDate = searchParams.get('bookingDate')
  const navigate = useNavigate()
  const edit = true // this page is always editable since it's a new booking request
  const goToDetailsAfterSave = useRef(false)
  const canViewDocuments = checkPermission(permissionRequests.canViewDocuments)
  const canViewOpStandards = checkPermission(permissionRequests.canViewOpStandards)
  const users = useAppSelector(state => state.users)

  useImportDoctorstIntoState()

  const doctorList = React.useMemo(() => Object.values(users)
    .filter((user: Partial<IUser>) => user?.isDoctor), [users])

  const form = useFormik<CaseForm>({
    validateOnMount: true,
    initialValues: {
      ...bookingInitialValues,
      bookingSection: {
        ...bookingInitialValues.bookingSection,
        date: passedDate ? new Date(passedDate) : bookingInitialValues.bookingSection.date,
      },
    },
    validationSchema: yup.object({
      bookingPatient: patientValidationSchema,
      bookingSection: bookingValidationSchema,
      surgerySection: surgeryValidationSchema,
      notesSection: notesValidationSchema,
    }),
    onSubmit: async (values, actions) => {
      if (isAllValid)
        if (!outsideDoctorSlots) {
          const response = await createBookingRequest(values)
          if (response?.error == null) {
            actions.resetForm()
            if (goToDetailsAfterSave.current) navigate(routes.caseDetails.replace(':caseId', response.caseId))
            else navigate(-1)
          }
          goToDetailsAfterSave.current = false
        } else {
          setConfirmSave(true)
        }
    },
  })

  const getContracts = useImportContractsByDoctorIdIntoState()

  useEffect(() => {
    if (form.values.bookingSection.doctorId) getContracts(form.values.bookingSection.doctorId)
  }, [form.values.bookingSection.doctorId])

  const tabs: { [key: string]: any } = {
    patient: {
      key: 'patient',
      component: (
        <PatientInformationTab
          edit={edit}
          form={form}
        />
      ),
      isValid: !form?.errors?.bookingPatient,
    },
    booking: {
      key: 'booking',
      component: (
        <BookingInformationTab
          edit={edit}
          form={form}
          setOutsideDoctorSlots={setOutsideDoctorSlots}
        />
      ),
      isValid: !form?.errors?.bookingSection,
    },
    ...(canViewOpStandards && {
      surgery: {
        key: 'surgery',
        component: <SurgeryDetailsTab
          edit={edit}
          form={form}
          canViewSurgeryInfo={true}
          canEditSurgeryInfo={true}
        />,
        isValid: !form?.errors?.surgerySection,
      },
    }),
    ...(canViewDocuments && {
      documents: {
        key: 'documents',
        component: <DocumentsTab edit={edit} form={form} />,
        isValid: true,
      },
    }),
  }
  const [tab, setTab] = useState(Object.keys(tabs)[0])

  const isAllValid =
    !form?.errors?.surgerySection &&
    !form?.errors?.bookingSection &&
    !form?.errors?.bookingPatient

  const saveAndGoToDetails = () => {
    goToDetailsAfterSave.current = true
    form.submitForm()
  }

  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('bookingRequest_title')} showBackButton>
        <SaveButton onClick={() => setOpenSave(true)} disabled={!isAllValid || isLoading} />
      </PageHeader>
      <Card
        sx={{
          position: 'relative',
          overflow: 'auto',
          height: 'calc(100vh - 192px)',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_e, newValue) => setTab(newValue)}
          textColor='primary'
          indicatorColor='primary'
          centered
          sx={{
            position: 'sticky',
            top: -8,
            zIndex: 1000,
            bgcolor: 'background.paper',
            ...defaultStyles.HorizontalTabsSx,
          }}
        >
          {Object.values(tabs).map(tab => (
            <Tab
              value={tab.key}
              key={tab.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {trlb('booking_tab_' + tab.key)}
                  {tab.isValid
                    ? <CheckCircle sx={{ fill: theme => theme.palette.primary.main }} />
                    : <WarningIcon />}
                </Box>
              }
              sx={{ fontWeight: '600' }}
            />
          ))}
        </Tabs>
        {tabs[tab].component}
      </Card>
      <ConfirmSaveModal
        confirmSave={confirmSave}
        setConfirmSave={setConfirmSave}
        setOutsideDoctorSlots={setOutsideDoctorSlots}
        onCancel={() => {
          setConfirmSave(false)
          goToDetailsAfterSave.current = false
        }}
        onConfirm={() => {
          setOutsideDoctorSlots(false)
          form.submitForm()
          setConfirmSave(false)
        }}
      />
      <SaveModal
        open={openSave}
        onConfirm={() => {
          setOpenSave(false)
          form.submitForm()
        }}
        form={form}
        doctor={doctorList.find(doctor => doctor.id === form.values.bookingSection.doctorId)}
        onConfirmAndGoToDetails={saveAndGoToDetails}
        onCancel={() => setOpenSave(false)}
      />
    </PageContainer>
  )
}

export default BookingRequest
