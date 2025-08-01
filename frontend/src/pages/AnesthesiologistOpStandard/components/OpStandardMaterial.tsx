import React from 'react'
import { FormikProps } from 'formik'
import OpStandardTable from 'pages/OpStandardManagement/components/OpStandardTable'
import { OpStandardMaterialsSubSection, OpStandardMedicationsSubSection } from 'components/materials/CommonsSubSections'
import { AnesthesiologistOpStandard } from '@smambu/lib.constants'

export const OPStandardMaterial = ({
  edit,
  form,
  formPath,
  addRowText,
  title,
}: {
  edit: boolean
  form: FormikProps<AnesthesiologistOpStandard>
  formPath: string
  addRowText?: string
  title?: string
}) => {
  const {
    addRow,
    columns,
    deleteRows,
    rows,
    title: titleFromSubSection,
    addRowText: addRowTextFromSubSection,
  } = formPath === 'medications'
    ? OpStandardMedicationsSubSection({
      form,
      formPath,
      caseDetails: false,
      showTimeStamp: false,
    })
    : OpStandardMaterialsSubSection({
      form,
      formPath,
      addRowText,
      title,
    })

  return (
    <OpStandardTable
      edit={edit}
      form={form}
      addRow={addRow}
      noAddButtonOnEmpty={false}
      addRowText={addRowText ?? addRowTextFromSubSection}
      columns={columns}
      deleteRows={deleteRows}
      formPath={formPath}
      rows={rows}
      title={title ?? titleFromSubSection}
    />
  )
}
