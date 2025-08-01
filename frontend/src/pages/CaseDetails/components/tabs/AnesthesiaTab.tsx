import { Box, Grid } from '@mui/material'
import { AnesthesiologistOpStandard, CaseForm, OpStandardMaterial, OpStandardMedication, permissionRequests } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import { FormikProps } from 'formik'
import React, { useState } from 'react'
import { SectionTitle, Space20 } from 'components/Commons'
import { useGetAnesthesiologistOPStandardFunction } from 'hooks'
import {
  AnesthesiaNotes,
  AnesthesiaTimestampsContainer,
  AnesthesiaTypesContainer,
  AnesthesiologistsList,
  ChangeAnesthesiologistOpStandardAlert,
  PatientTimestampsContainer,
} from '../AnesthesiaTabsParts'
import AnesthesiaDocumentation from '../components/AnesthesiaDocumentation'
import { trlb } from 'utilities'
import AnesthesiaOpStandardSelector from '../components/AnesthesiaOpStandardSelector'

const AnesthesiaTab = ({
  form,
  edit,
  warningFields,
}: {
  form: FormikProps<CaseForm>
  edit: boolean
  warningFields: string[]
}) => {
  const getAnesthesiologistOPS = useGetAnesthesiologistOPStandardFunction()
  const checkPermission = useGetCheckPermission()
  const canViewAnesthesiologists = checkPermission(permissionRequests.canViewAnesthesiologists)
  const canViewpatientTimestamps = checkPermission(permissionRequests.canViewPatientTimestamps)

  // eslint-disable-next-line max-len
  const canViewAnesthesiaTimestamps = checkPermission(permissionRequests.canViewAnesthesiaTimestamps)

  // eslint-disable-next-line max-len
  const canViewAnesthesiaDocumentation = checkPermission(permissionRequests.canViewAnesthesiaDocumentation)
  // eslint-disable-next-line max-len
  const canEditAnesthesiaDocumentation = checkPermission(permissionRequests.canEditAnesthesiaDocumentation)
  const canViewSurgeryNotes = checkPermission(permissionRequests.canViewSurgeryNotes)
  const canEditSurgeryNotes = checkPermission(permissionRequests.canEditSurgeryNotes)
  const [opStandardSelected, setopStandardSelected] = useState('')
  const anesthesiologistOpStandard = form.values.anesthesiaSection.anesthesiologistOpStandard

  const handleConfirm = async (opStandardSelected: string) => {
    // eslint-disable-next-line max-len
    const parseMaterials = <T extends OpStandardMaterial | OpStandardMedication>(materials: T[]): T[] =>
      materials.map(material => ({
        ...material,
        amount: material.prefill ? material.amount : 0,
      }))

    const op: AnesthesiologistOpStandard = await getAnesthesiologistOPS(opStandardSelected)
    form.setFieldValue('anesthesiaSection', {
      ...op,
      preExistingConditions: [],
      requiredServices: [],
      interoperativeMeasure: [],
      anesthesiaList: form.values.anesthesiaSection.anesthesiaList,
      anesthesiologistOpStandardId: opStandardSelected,
      anesthesiologistOpStandard: op,
      materials: parseMaterials(op.materials),
      medications: parseMaterials(op.medications),
      ventilationMaterials: parseMaterials(op.ventilationMaterials),
    })
    setopStandardSelected('')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        <SectionTitle text={trlb('case_tab_anesthesia')} />
        {canViewAnesthesiologists && <AnesthesiologistsList form={form} edit={edit} />}
        <AnesthesiaOpStandardSelector
          form={form}
          edit={edit}
          setopStandardSelected={setopStandardSelected}
        />
        <AnesthesiaTypesContainer form={form} edit={edit} />
        <SectionTitle text={trlb('case_tab_anesthesia_timestamps')} />
        <Space20 />
        {canViewpatientTimestamps && (
          <PatientTimestampsContainer form={form} edit={edit} warningFields={warningFields} />
        )}
        {canViewAnesthesiaTimestamps && (
          <AnesthesiaTimestampsContainer form={form} edit={edit} warningFields={warningFields} />
        )}
        {canViewAnesthesiaDocumentation && (
          <AnesthesiaDocumentation
            form={form}
            formPath='anesthesiaSection.'
            edit={edit}
            canEditAnesthesiaDocumentation={canEditAnesthesiaDocumentation}
            anesthesiologistOpStandard={anesthesiologistOpStandard}
          />
        )}
        {canViewSurgeryNotes && <AnesthesiaNotes form={form} edit={edit && canEditSurgeryNotes} />}
        <ChangeAnesthesiologistOpStandardAlert
          open={Boolean(opStandardSelected)}
          handleConfirm={async () => {
            await handleConfirm(opStandardSelected)
          }}
          handleClose={() => setopStandardSelected('')}
        />
      </Grid>
    </Box>
  )
}

export default AnesthesiaTab
