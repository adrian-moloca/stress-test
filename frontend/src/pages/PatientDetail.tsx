import React, { useEffect } from 'react'
import { PageContainer, PageHeader, SectionTitle, Panel, Space20 } from 'components/Commons'
import { EditButton, SaveButton } from 'components/Buttons'
import { PatientInformationFormFields } from 'components/Forms'
import { routes } from 'routes/routes'
import { trlb } from '../utilities/translator/translator'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from 'store'
import { Patient, permissionRequests, phoneRegex, validateEmail } from '@smambu/lib.constants'
import { FlexPatientCases } from 'components/FlexCommons'
import { useFetchPatient, useUpdatePatient } from 'hooks/patientsHooks'
import { useGetPatientCases } from 'hooks/caseshooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import { Box } from '@mui/material'
import ItemNotFound from './ItemNotFound'

const PatientDetailsPage = ({ isEdit }: { isEdit?: boolean }) => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const checkPermission = useGetCheckPermission()
  const navigate = useNavigate()
  const [edit, setEdit] = React.useState(isEdit)

  const { patientId: selectedPatientId } = useParams()

  const patient = useFetchPatient(selectedPatientId)

  const editPatient = useUpdatePatient()
  useGetPatientCases(selectedPatientId ?? '')
  const canViewCases = checkPermission(permissionRequests.canViewCases)
  const canViewCasesBookingInfo = checkPermission(permissionRequests.canViewCasesBookingInfo)

  const cases = useAppSelector(state => state.cases)
  const selectedPatientCases = Object.values(cases)
    .filter(caseItem => caseItem.patientRef === selectedPatientId)
    .sort((a, b) => (new Date(a.bookingSection.date) > new Date(b.bookingSection.date) ? -1 : 1))
    .slice(0, 3)

  const canEditPatient = checkPermission(permissionRequests.canEditPatient, { patient: patient! })
  const form = useFormik({
    validateOnMount: true,
    initialValues: {
      patientId: '',
      patientNumber: '',
      debtorNumber: '',
      title: '',
      name: '',
      surname: '',
      birthDate: null as Date | null,
      gender: '',
      genderSpecifics: '',
      genderBirth: '',
      nationality: '',
      phoneNumber: '',
      email: '',
      doctorsIds: [],
      address: {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: '',
      },
    },
    validationSchema: yup.object({
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
    } as any),
    // XXX this is required because someone, for some reason, decided to use formik
    // for a "simple" object state. Changing this now to a proper state is a huge
    // job, that we'll probably save for when we (finally) get rid of formik -
    // but i removed the body of the function in favour of an obvious "placeholder"
    onSubmit: () => {},
  })

  const selectPatient = (patient: Patient) => {
    form.setValues({
      patientId: patient.patientId,
      patientNumber: patient.patientNumber,
      debtorNumber: patient.debtorNumber,
      title: patient.title ?? '',
      name: patient.name,
      surname: patient.surname,
      birthDate: patient.birthDate,
      gender: patient.gender,
      genderSpecifics: patient.genderSpecifics ?? '',
      genderBirth: patient.genderBirth,
      nationality: patient.nationality,
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      doctorsIds: patient.doctorsIds,
      address: {
        street: patient.address?.street,
        houseNumber: patient.address?.houseNumber,
        postalCode: patient.address?.postalCode,
        city: patient.address?.city,
        country: patient.address?.country,
      },
    })
  }
  const goToEditMode = () => {
    navigate(routes.mapPatientEdit(selectedPatientId), { replace: true })
    setEdit(true)
  }
  const saveAndGoToPatientDetails = async () => {
    await editPatient(form.values)
    setEdit(false)
    navigate(routes.patientsList)
  }

  useEffect(() => {
    if (patient) selectPatient(patient)
    else form.resetForm()
  }, [patient])

  if (patient == null && isLoading) return null
  if (patient == null) return <ItemNotFound message={trlb('patient_not_found')} />

  const getButton = () => {
    if (canEditPatient)
      return edit
        ? (
          <SaveButton
            onClick={saveAndGoToPatientDetails}
            disabled={!form.isValid || isLoading}
          />
        )
        : (
          <EditButton onClick={goToEditMode} disabled={isLoading} />
        )

    return null
  }

  const showPatientRecentCases = !edit && canViewCases && canViewCasesBookingInfo

  return (
    <PageContainer>
      <PageHeader
        edit={edit}
        setEdit={setEdit}
        showBackButton
        pageTitle={!edit ? trlb('patient_details') : trlb('edit_patient')}
      >
        {getButton()}
      </PageHeader>
      <Panel>
        <SectionTitle text={trlb('costEstimate_patient_info')} />
        <PatientInformationFormFields
          readOnly={!edit}
          form={form}
          values={form.values}
          errors={form.errors}
          touched={form.touched}
          section=''
        />
      </Panel>
      {showPatientRecentCases && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: '800px',
            }}
          >
            <SectionTitle text={trlb('patient_cases')} />
            <FlexPatientCases
              patientCases={selectedPatientCases}
              patientId={form.values.patientId}
            />
          </Box>
        </Box>
      )}
      <Space20 />
    </PageContainer>
  )
}

export default PatientDetailsPage
