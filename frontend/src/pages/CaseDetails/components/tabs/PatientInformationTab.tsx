import React, { useState } from 'react'
import {
  Box,
  Button,
  Grid,
  Modal,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material'
import { SectionTitle, Space20 } from 'components/Commons'
import { PatientInformationFormFields } from 'components/Forms'
import { trlb } from 'utilities'
import { CaseForm, permissionRequests } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import {
  useCreatePatient,
  useGetAssociatePatientsTableRows,
  useGetPatients,
} from 'hooks/patientsHooks'
import { FormikProps } from 'formik'
import { FlexDataTable } from 'components/FlexCommons'

const PatientInformationTab = ({
  edit,
  form,
  warningFields,
  setPatientAssociationButtonClicked,
}: {
  edit: boolean
  form: FormikProps<CaseForm>
  warningFields: string[]
  setPatientAssociationButtonClicked: (newValue: any) => void
}) => {
  const checkPermission = useGetCheckPermission()
  const patients = useGetPatients({
    name: form.values.bookingPatient.name,
    surname: form.values.bookingPatient.surname,
    birthDate: form.values.bookingPatient?.birthDate,
    address: form.values.bookingPatient?.address,
  })
  const createPatient = useCreatePatient()
  const canSetCheckinTimestamp = checkPermission(permissionRequests.canSetCheckinTimestamp)
  const canEditPatients = checkPermission(permissionRequests.canEditPatients)
  // eslint-disable-next-line max-len
  const canEditBookingPatientDetails = checkPermission(permissionRequests.canEditBookingPatientDetails)
  const [clickedPatient, setClickedPatient] = useState('')

  const canEditPatientInfo = React.useMemo(
    () => canEditPatients || (canEditBookingPatientDetails && form.values.bookingPatient.patientNumber === ''),
    [canEditPatients, canEditBookingPatientDetails, form.values.bookingPatient.patientNumber],
  )

  const currPatient = React.useMemo(() => {
    return patients?.find(patient => patient.patientId === clickedPatient)
  }, [clickedPatient, patients])

  const columns = [
    {
      field: 'nameSurname',
      headerName: trlb('name_and_surname'),
      width: 200,
    },
    {
      field: 'insuranceNumber',
      headerName: trlb('insurance_number'),
      width: 200,
    },
    {
      field: 'birthDate',
      headerName: trlb('userField_BirthDate'),
      width: 150,
    },
    {
      field: 'email',
      headerName: trlb('userField_Email'),
      width: 250,
    },
    {
      field: 'address',
      headerName: trlb('patientForm_Address'),
      width: 400,
    },
  ]
  const rows = useGetAssociatePatientsTableRows(form, patients ?? [])

  const handleAssociatePatient = () => {
    form.setFieldValue('bookingPatient', currPatient)
    form.setFieldValue('associatedPatient', currPatient)
    form.setFieldValue('patientRef', clickedPatient)
    setClickedPatient('')
    setPatientAssociationButtonClicked(false)
  }

  const handleNewPatient = async () => {
    const res = await createPatient(form.values.bookingPatient)
    form.setFieldValue('bookingPatient', res)
    form.setFieldValue('associatedPatient', res)
    form.setFieldValue('patientRef', res.patientId)
    setPatientAssociationButtonClicked(false)
  }

  const canViewPatients = checkPermission(permissionRequests.canViewPatients)

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <SectionTitle text={trlb('patient_information')} />
      <PatientInformationFormFields
        readOnly={!edit || !canEditPatientInfo}
        form={form}
        values={form.values.bookingPatient}
        errors={form.errors.bookingPatient}
        touched={form.touched.bookingPatient}
        section='bookingPatient'
        warningFields={warningFields}
      />
      <Space20 />
      {(edit && canSetCheckinTimestamp && !form.values.patientRef && canViewPatients) &&
        <>
          <SectionTitle text={trlb('matching_patients')} />
          <Grid container>
            <Grid item xs={10}>
              <FlexDataTable
                columns={columns}
                rows={rows}
                onRowClick={(r: { id: string }) => setClickedPatient(r.id)}
                autoHeight
              />
            </Grid>
            <Grid item xs={2}>
              {canEditPatients && (
                <Box display={'flex'} justifyContent={'center'}>
                  <Button onClick={handleNewPatient}>{trlb('newPatient')}</Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </>
      }
      <Modal
        open={Boolean(clickedPatient)}
        onClose={() => setClickedPatient('')}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box
          sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper sx={{ width: '50%', p: 4 }}>
            <SectionTitle text={trlb('associate_override_patient')} />
            <Typography variant='subtitle1'>
              <strong>{trlb('name_and_surname')}</strong>: {`${currPatient?.name} ${currPatient?.surname}`}
            </Typography>
            <Typography variant='subtitle1'>
              <strong>{trlb('userField_BirthDate')}</strong>: {currPatient?.birthDate.toLocaleDateString()}
            </Typography>
            <Typography variant='subtitle1'>
              <strong>{trlb('userField_Email')}</strong>: {currPatient?.email}
            </Typography>
            <Typography variant='subtitle1'>
              <strong>{trlb('patientForm_Address')}</strong>:{' '}
              {`${currPatient?.address?.street} ${currPatient?.address?.houseNumber}, ${currPatient?.address?.city}`}
            </Typography>
            <Toolbar sx={{ justifyContent: 'space-between', mb: -2, mt: 2 }} disableGutters>
              <Button onClick={() => setClickedPatient('')}>{trlb('commons_cancel')}</Button>
              <Button variant='contained' onClick={handleAssociatePatient}>
                {trlb('associate_update_patient')}
              </Button>
            </Toolbar>
          </Paper>
        </Box>
      </Modal>
    </Box>
  )
}

export default PatientInformationTab
