import React from 'react'
import { OpStandardTabsProps } from '@smambu/lib.constants'
import {
  Notes,
  OpStandardMaterialsSubSection,
  OpStandardMedicationsSubSection,
} from 'components/materials/CommonsSubSections'
import { InstructionsListSubSection } from 'components/materials/InstructionsList'
import { Box } from '@mui/material'
import OpStandardTablesBar from 'components/materials/OpStandardTablesBar'
import { DynamicTable } from './DynamicTable'

const PreOpSection = ({ edit, form, formPath = '', caseDetails }: OpStandardTabsProps) => {
  const tablesProps = [
    InstructionsListSubSection({ form, formPath: formPath + 'instructions', caseDetails }),
    OpStandardMaterialsSubSection({ form, formPath: formPath + 'materials' }),
    OpStandardMedicationsSubSection({ form, formPath: formPath + 'medications', caseDetails }),
  ]
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DynamicTable {...{
        tablesProps: tablesProps
          .map(tp => ({ data: tp, noAddButtonOnEmpty: true })),
        edit,
        form
      }} />
      <OpStandardTablesBar {...{ edit, tablesProps }} />
      {!caseDetails ? <Notes {...{ edit, form }} formPath={formPath + 'notes'} /> : null}
    </Box>
  )
}

export default PreOpSection
