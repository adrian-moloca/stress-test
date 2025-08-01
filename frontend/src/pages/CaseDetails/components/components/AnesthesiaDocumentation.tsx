import { AnesthesiologistOpStandard, CaseForm } from '@smambu/lib.constants'
import { Box } from '@mui/material'
import { SectionTitle } from 'components/Commons'
import { AnesthesiaMultiSelect, VolatileAnestheticsContainer } from 'components/materials/AnesthesiaComponents'
import { OpStandardMaterialsSubSection, OpStandardMedicationsSubSection } from 'components/materials/CommonsSubSections'
import { Positions } from 'components/materials/IntraOpComponents'
import { FormikProps } from 'formik'
import OpStandardTable from 'pages/OpStandardManagement/components/OpStandardTable'
import React from 'react'
import { trlb } from 'utilities'

const AnesthesiaDocumentation = ({
  edit,
  form,
  formPath,
  canEditAnesthesiaDocumentation,
  anesthesiologistOpStandard,
}: {
  edit: boolean
  form: FormikProps<CaseForm>
  formPath: string
  canEditAnesthesiaDocumentation: boolean
  anesthesiologistOpStandard: AnesthesiologistOpStandard | null
}) => {
  const ventilationMaterialsProps = OpStandardMaterialsSubSection({
    form,
    formPath: formPath + 'ventilationMaterials',
    addRowText: 'add_ventilation_material',
    title: 'case_tab_anesthesia_VentilationMaterials',
  })

  const medicationsProps = OpStandardMedicationsSubSection({
    form,
    formPath: formPath + 'medications',
    caseDetails: true,
    showTimeStamp: true,
  })

  const materialsProps = OpStandardMaterialsSubSection({ form, formPath: formPath + 'materials' })

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, px: 2 }}>
      <SectionTitle text={trlb('case_tab_anesthesia_documentation')} />
      <Positions
        edit={edit && canEditAnesthesiaDocumentation}
        form={form}
        caseDetails={false}
        formPath={formPath + 'positions'}
        timestampsFormPath={`${formPath}.positionsTimestamps`}
        title='case_tab_anesthesia_positioning'
      />
      <OpStandardTable
        edit={edit && canEditAnesthesiaDocumentation}
        form={form}
        formPath={ventilationMaterialsProps.formPath}
        title={ventilationMaterialsProps.title}
        columns={ventilationMaterialsProps.columns}
        rows={ventilationMaterialsProps.rows}
        deleteRows={ventilationMaterialsProps.deleteRows}
        addRow={ventilationMaterialsProps.addRow}
        addRowText={ventilationMaterialsProps.addRowText}
        noAddButtonOnEmpty={false}
      />
      <AnesthesiaMultiSelect
        edit={edit && canEditAnesthesiaDocumentation}
        form={form}
        selectableValues={anesthesiologistOpStandard?.preExistingConditions}
        formPath={formPath + 'preExistingConditions'}
        title='case_tab_anesthesia_preExistingCondition'
      />
      <AnesthesiaMultiSelect
        edit={edit && canEditAnesthesiaDocumentation}
        form={form}
        selectableValues={anesthesiologistOpStandard?.interoperativeMeasure}
        formPath={formPath + 'interoperativeMeasure'}
        title='case_tab_anesthesia_intraoperativeMeasures'
      />
      <VolatileAnestheticsContainer edit={edit} form={form} />
      <OpStandardTable
        edit={edit && canEditAnesthesiaDocumentation}
        form={form}
        formPath={medicationsProps.formPath}
        title={medicationsProps.title}
        columns={medicationsProps.columns}
        rows={medicationsProps.rows}
        deleteRows={medicationsProps.deleteRows}
        addRow={medicationsProps.addRow}
        addRowText={medicationsProps.addRowText}
        noAddButtonOnEmpty={false}
      />
      <OpStandardTable
        edit={edit && canEditAnesthesiaDocumentation}
        form={form}
        formPath={materialsProps.formPath}
        title={materialsProps.title}
        columns={materialsProps.columns}
        rows={materialsProps.rows}
        deleteRows={materialsProps.deleteRows}
        addRow={materialsProps.addRow}
        addRowText={materialsProps.addRowText}
        noAddButtonOnEmpty={false}
      />
      <AnesthesiaMultiSelect
        edit={edit && canEditAnesthesiaDocumentation}
        form={form}
        selectableValues={anesthesiologistOpStandard?.requiredServices}
        formPath={formPath + 'requiredServices'}
        title='case_tab_anesthesia_anesthesiologicalServices'
      />
    </Box>
  )
}

export default AnesthesiaDocumentation
