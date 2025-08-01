import { Measures, OpStandardTabsProps, AnesthesiologicalService } from '@smambu/lib.constants'
import { Box, Checkbox, FormControlLabel } from '@mui/material'
import React from 'react'
import {
  Notes,
  OpStandardMaterialsSubSection,
  OpStandardMedicationsSubSection,
} from 'components/materials/CommonsSubSections'
import { InstructionsListSubSection } from 'components/materials/InstructionsList'
import OpStandardTable from 'pages/OpStandardManagement/components/OpStandardTable'
import SectionWrapper from 'components/materials/SectionWrapper'
import OpStandardTablesBar from 'components/materials/OpStandardTablesBar'
import { trlb } from 'utilities'

const PostOpSection = ({ edit, form, formPath, caseDetails }: OpStandardTabsProps) => {
  const tablesProps = [
    InstructionsListSubSection({ form, formPath: formPath + 'instructions', caseDetails }),
    OpStandardMaterialsSubSection({ form, formPath: formPath + 'materials' }),
    OpStandardMedicationsSubSection({ form, formPath: formPath + 'medications', caseDetails }),
  ]
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <OpStandardTable
        {...{
          edit,
          form,
          ...tablesProps[0],
          noAddButtonOnEmpty: true,
        }}
      />
      <OpStandardTable
        {...{
          edit,
          form,
          ...tablesProps[1],
          noAddButtonOnEmpty: true,
        }}
      />
      <OpStandardTable
        {...{
          edit,
          form,
          ...tablesProps[2],
          noAddButtonOnEmpty: true,
        }}
      />
      <OpStandardTablesBar {...{ edit, tablesProps }} />
      <PostoperativeMeasures {...{ edit, form }} />
      <AnesthesiologicalServices {...{ edit, form }} formPath={`${formPath}.anesthesiologicalServices`} />
      <Notes {...{ edit, form }} formPath={formPath + 'notes'} />
    </Box>
  )
}

export const PostoperativeMeasures = ({ edit, form }: OpStandardTabsProps) => {
  const measureList = Object.keys(Measures)
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

export const AnesthesiologicalServices = ({ edit, form }: OpStandardTabsProps) => {
  const anesthesiologicalServiceList = Object.keys(AnesthesiologicalService)
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

export default PostOpSection
