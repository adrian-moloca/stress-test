import React from 'react'
import {
  AnesthesiologicalService,
  Measures,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardTabsProps,
  getCaseOpStandard,
} from '@smambu/lib.constants'
import { Box, Checkbox, FormControlLabel } from '@mui/material'
import {
  Notes,
  OpStandardMaterialsSubSection,
  OpStandardMedicationsSubSection,
} from 'components/materials/CommonsSubSections'
import { DynamicTable } from 'pages/OpStandardManagement/components/DynamicTable'
import { InstructionsListSubSection } from 'components/materials/InstructionsList'
import OpStandardTablesBar from 'components/materials/OpStandardTablesBar'
import { useAppSelector } from 'store'
import SectionWrapper from 'components/materials/SectionWrapper'
import { trlb } from 'utilities'

// eslint-disable-next-line @stylistic/space-before-function-paren
function fieldNameOf<T>(name: keyof T) {
  return name
}

const CasePostOpSection = ({
  edit,
  form,
  formPath = '',
  caseDetails,
  warningFields,
  showDocumentationWarnings,
  showBillingWarning,
}: OpStandardTabsProps) => {
  const caseOpStandardMaterialsSubSection = () => {
    const opMat = OpStandardMaterialsSubSection({ form, formPath: formPath + 'materials' })
    return {
      ...opMat,
      section: 'postOpSection.materials',
      warningFields,
      columns: opMat.columns.filter(col => col.field !== fieldNameOf<OpStandardMaterial>('prefill')),
    }
  }
  const caseOpStandardMedicationsSubSection = () => {
    const opMat = OpStandardMedicationsSubSection({ form, formPath: formPath + 'medications', caseDetails })
    return {
      ...opMat,
      section: 'postOpSection.medications',
      warningFields,
      columns: opMat.columns.filter(col => col.field !== fieldNameOf<OpStandardMedication>('prefill')),
    }
  }

  const tablesProps = [
    InstructionsListSubSection({ form, formPath: formPath + 'instructions', caseDetails }),
    caseOpStandardMaterialsSubSection(),
    caseOpStandardMedicationsSubSection(),
  ]

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DynamicTable
        {...{
          tablesProps: tablesProps.map(tp => ({ data: tp, noAddButtonOnEmpty: true })),
          edit,
          form,
          showDocumentationWarnings,
          showBillingWarning,
        }}
      />
      <OpStandardTablesBar {...{ edit, tablesProps }} />
      <CasePostoperativeMeasures {...{ edit, form }} />
      <CaseAnesthesiologicalServices {...{ edit, form }} formPath={`${formPath}.anesthesiologicalServices`} />
      {!caseDetails ? <Notes {...{ edit, form }} formPath={formPath + 'notes'} /> : null}
    </Box>
  )
}

export const CasePostoperativeMeasures = ({ edit, form }: OpStandardTabsProps) => {
  const contracts = useAppSelector(state => state.contracts)
  const opStandard = getCaseOpStandard({ caseForm: form.values, contracts })

  const measureList = Object.values(Measures).filter(measure =>
    opStandard?.postOpSection.postOperativeMeasures.includes(measure))

  const measures = form.values.postOpSection.postOperativeMeasures ?? []

  const isChecked = (val: string) => (measures ?? []).includes(val)

  const handleChange = (value: boolean, field: string) => {
    if (value) form.setFieldValue('postOpSection.postOperativeMeasures', [...measures, field])
    else
      form.setFieldValue(
        'postOpSection.postOperativeMeasures',
        measures.filter((measure: string) => measure !== field),
      )
  }

  return (
    <SectionWrapper title='op_standard_post_operative_measures'>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {measureList.map(measure => (
          <FormControlLabel
            key={measure}
            control={
              <Checkbox
                sx={{ fill: '#fff' }}
                checked={isChecked(measure)}
                onChange={e => edit && handleChange(e.target.checked, measure)}
              />
            }
            label={trlb(measure)}
          />
        ))}
      </Box>
    </SectionWrapper>
  )
}

export const CaseAnesthesiologicalServices = ({ edit, form }: OpStandardTabsProps) => {
  const contracts = useAppSelector(state => state.contracts)
  const opStandard = getCaseOpStandard({ caseForm: form.values, contracts })

  const anesthesiologicalServiceList = Object.values(AnesthesiologicalService).filter(serv =>
    opStandard?.postOpSection.anesthesiologicalServices.includes(serv))
  const anesthesiologicalServices = form.values.postOpSection.anesthesiologicalServices ?? []

  const isChecked = (field: string) => (anesthesiologicalServices ?? []).includes(field)

  const handleChange = (value: boolean, field: string) => {
    if (value) form.setFieldValue('postOpSection.anesthesiologicalServices', [...anesthesiologicalServices, field])
    else
      form.setFieldValue(
        'postOpSection.anesthesiologicalServices',
        anesthesiologicalServices
          .filter((anesthesiologicalService: string) => anesthesiologicalService !== field),
      )
  }

  return (
    <SectionWrapper title='op_standard_anesthesiological_services'>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {anesthesiologicalServiceList.map(anesthesiologicalService => (
          <FormControlLabel
            key={anesthesiologicalService}
            control={
              <Checkbox
                sx={{ fill: '#fff' }}
                checked={isChecked(anesthesiologicalService)}
                onChange={e => edit && handleChange(e.target.checked, anesthesiologicalService)}
              />
            }
            label={trlb(anesthesiologicalService)}
          />
        ))}
      </Box>
    </SectionWrapper>
  )
}

export default CasePostOpSection
