import React from 'react'
import { OpStandardMaterial, OpStandardMedication, OpStandardTabsProps } from '@smambu/lib.constants'
import { Box } from '@mui/material'
import {
  Notes,
  OpStandardMaterialsSubSection,
  OpStandardMedicationsSubSection,
} from 'components/materials/CommonsSubSections'
import { DynamicTable } from 'pages/OpStandardManagement/components/DynamicTable'
import { InstructionsListSubSection } from 'components/materials/InstructionsList'
import OpStandardTablesBar from 'components/materials/OpStandardTablesBar'

const fieldNameOf = <T, >(name: keyof T) => {
  return name
}

const CasePreOpSection = ({
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
      warningFields,
      section: 'preOpSection.materials',
      columns: opMat.columns.filter(col => col.field !== fieldNameOf<OpStandardMaterial>('prefill')),
    }
  }
  const caseOpStandardMedicationsSubSection = () => {
    const opMat = OpStandardMedicationsSubSection({ form, formPath: formPath + 'medications', caseDetails })
    return {
      ...opMat,
      warningFields,
      section: 'preOpSection.medications',
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
      {!caseDetails ? <Notes {...{ edit, form }} formPath={formPath + 'notes'} /> : null}
    </Box>
  )
}

export default CasePreOpSection
