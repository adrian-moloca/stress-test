import { Instruction } from '@smambu/lib.constants'
import { FormikProps } from 'formik'

import { getFieldError, getFieldValue, trlb } from 'utilities'

export const InstructionsListSubSection = ({
  form,
  formPath,
  caseDetails,
}: {
  form: FormikProps<any>
  formPath: string
  caseDetails?: boolean
  edit?: boolean
}) => {
  const instructionsList = getFieldValue(form, formPath) ?? []

  const deleteRows = (indexes: number[]) => {
    form.setFieldValue(
      formPath,
      instructionsList.filter((_: Instruction, _index: number) => !indexes.includes(_index)),
    )
  }

  const addRow = () => {
    form.setFieldValue(formPath, [
      ...instructionsList,
      {
        content: '',
        mandatory: false,
      },
    ])
  }

  return {
    table: true,
    formPath,
    title: 'preOp_instructions',
    isValid: !(
      getFieldError(form, formPath) ||
      (caseDetails &&
        form?.values?.preOpSection?.instructions?.some((i: any) => i?.mandatory && !i?.checked))
    ),
    columns: [
      ...(caseDetails
        ? [
          {
            field: 'checked',
            headerName: trlb('done'),
            type: 'boolean',
            getError: (row: any) => !row?.checked && row?.mandatory,
            getHelperText: (row: any) =>
              !row?.checked && row?.mandatory ? 'case_tab_mandatory_instruction_error' : ' ',
          },
        ]
        : []),
      {
        field: 'content',
        headerName: trlb('instruction'),
        flex: 1,
        type: 'text',
      },
      ...(!caseDetails
        ? [
          {
            field: 'mandatory',
            headerName: trlb('compulsory_label'),
            type: 'boolean',
          },
        ]
        : []),
    ],
    rows: instructionsList,
    deleteRows,
    addRow,
    addRowText: 'add_instruction',
  }
}

export const InstructionsList = () => null
