import {
  NewMaterial,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardTabsProps,
  permissionRequests,
} from '@smambu/lib.constants'
import { TextField } from '@mui/material'
import React, { ChangeEvent, useMemo } from 'react'
import { getFieldError, getFieldTouched, getFieldValue, trlb } from 'utilities'
import { useOpStandardManagementContext } from './OpStandardContext'
import { FormikProps } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import SectionWrapper from './SectionWrapper'
import { Space10 } from 'components/Commons'

export const Notes = ({ edit, form, formPath }: OpStandardTabsProps) => {
  return (
    <SectionWrapper title={trlb('op_standard_notes')}>
      <TextField
        multiline={true}
        rows={4}
        type={'string'}
        label={trlb('op_standard_notes')}
        value={getFieldValue(form, formPath!)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => form
          .setFieldValue(formPath, e.target.value)}
        error={!!getFieldTouched(form, formPath!) && !!getFieldError(form, formPath!)}
        helperText={!!getFieldTouched(form, formPath!) && getFieldError(form, formPath!)}
        inputProps={{ readOnly: !edit }}
        fullWidth
      />
      <Space10 />
    </SectionWrapper>
  )
}
const fieldNameOf = <T, >(name: keyof T) => {
  return name
}
export const OpStandardMaterialsSubSection = ({
  form,
  formPath,
  addRowText = 'add_material',
  title = 'preOp_materials',
}: {
  form: FormikProps<any>
  formPath: string
  addRowText?: string
  title?: string
}) => {
  const checkPermission = useGetCheckPermission()
  const canViewMaterialsDatabase = checkPermission(permissionRequests.canViewMaterialsDatabase)
  const canViewMaterialsDatabaseNames =
    checkPermission(permissionRequests.canViewMaterialsDatabaseNames)
  const { materials } = useOpStandardManagementContext()
  const opStandardMaterials = useMemo(() => getFieldValue(form, formPath) ?? [], [form])

  const disabled = !canViewMaterialsDatabase && !canViewMaterialsDatabaseNames

  const materialMenuItems = useMemo(
    () =>
      (materials ?? []).map((material: NewMaterial) => ({
        value: material.id,
        label: material.name,
      })),
    [materials],
  )

  const deleteRows = (indexes: number[]) => {
    form.setFieldValue(
      formPath,
      opStandardMaterials
        .filter((_: OpStandardMaterial, _index: number) => !indexes.includes(_index)),
    )
  }

  const addRow = () => {
    form.setFieldValue(formPath, [
      ...opStandardMaterials,
      {
        materialId: '',
        amount: '',
        prefill: false,
        notes: '',
      },
    ])
  }

  return {
    table: true,
    formPath,
    title,
    columns: [
      {
        field: fieldNameOf<OpStandardMaterial>('materialId'),
        headerName: trlb('common_material'),
        flex: 1,
        type: 'autocomplete',
        options: materialMenuItems,
        parseValue: (value: string | number | boolean) =>
          materials.find((material: NewMaterial) => material.id === value)?.id || '',
        disabled,
      },
      {
        field: 'code',
        headerName: trlb('code'),
        valueGetter: (params: any) =>
          materialMenuItems.find((_: any) => _.value === params.row.materialId)?.value || '',
      },
      {
        field: fieldNameOf<OpStandardMaterial>('amount'),
        headerName: trlb('createReceipt_amount'),
        type: 'number',
        disabled,
      },
      {
        field: fieldNameOf<OpStandardMaterial>('prefill'),
        headerName: trlb('preFill'),
        type: 'boolean',
        disabled,
      },
      {
        field: fieldNameOf<OpStandardMaterial>('notes'),
        headerName: trlb('formBooking_Notes'),
        flex: 1,
        type: 'text',
        disabled,
      },
    ],
    rows: opStandardMaterials,
    deleteRows,
    addRow,
    addRowText,
  }
}

export const OpStandardMedicationsSubSection = ({
  form,
  formPath,
  caseDetails,
  showTimeStamp,
}: {
  form: FormikProps<any>
  formPath: string
  caseDetails?: boolean
  showTimeStamp?: boolean
}) => {
  const checkPermission = useGetCheckPermission()
  const canViewMaterialsDatabase = checkPermission(permissionRequests.canViewMaterialsDatabase)
  // eslint-disable-next-line max-len
  const canViewMaterialsDatabaseNames = checkPermission(permissionRequests.canViewMaterialsDatabaseNames)
  const { medications } = useOpStandardManagementContext()
  const medicationMenuItems = medications.map(medication => ({
    label: medication.name,
    value: medication.medicationId,
  }))
  const opStandardMedications = getFieldValue(form, formPath) ?? []

  const disabled = !canViewMaterialsDatabase && !canViewMaterialsDatabaseNames

  const deleteRows = (indexes: number[]) => {
    form.setFieldValue(
      formPath,
      opStandardMedications
        .filter((_: OpStandardMedication, _index: number) => !indexes.includes(_index)),
    )
  }

  const addRow = () => {
    form.setFieldValue(formPath, [
      ...opStandardMedications,
      {
        medicationId: '',
        amount: '',
        dosage: '',
        units: '',
        prefill: false,
        notes: '',
        ...(showTimeStamp ? { timestamp: new Date() } : {}),
      },
    ])
  }

  return {
    table: true,
    formPath,
    title: 'preOp_medications',
    columns: [
      {
        field: 'medicationId',
        headerName: trlb('preOp_medications'),
        flex: 1,
        type: 'autocomplete',
        options: medicationMenuItems,
        disabled,
      },
      {
        field: 'code',
        headerName: trlb('code'),
        valueGetter: (params: any) =>
          medications.find(_ => _.medicationId === params.row.medicationId)?.medicationCode || '',
      },
      {
        field: 'amount',
        headerName: trlb('createReceipt_amount'),
        type: 'number',
        disabled,
      },
      ...(caseDetails
        ? [
          {
            field: 'dosage',
            headerName: trlb('dosage'),
            type: 'number',
            disabled,
          },
        ]
        : []),
      {
        field: 'units',
        headerName: trlb('units'),
        type: 'text',
        disabled,
      },
      ...(showTimeStamp
        ? [
          {
            field: 'timestamp',
            headerName: trlb('timestamp'),
            flex: 0.75,
            type: 'dateTime',
            disabled,
          },
        ]
        : []),
      {
        field: 'prefill',
        headerName: trlb('preFill'),
        type: 'boolean',
        disabled,
      },
      {
        field: 'notes',
        headerName: trlb('formBooking_Notes'),
        flex: 0.5,
        type: 'text',
        disabled,
      },
    ],
    rows: opStandardMedications,
    deleteRows,
    addRow,
    addRowText: 'add_medication',
  }
}
