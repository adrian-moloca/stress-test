import {
  OpStandardMaterial,
  OpStandardPosition_Name,
  OpStandardSterileGood,
  OpStandardTabsProps,
  SterileGoodUnits,
  INTRAOPSECTIONS,
} from '@smambu/lib.constants'
import { Add } from '@mui/icons-material'
import { Box, Button, Checkbox, FormControlLabel, Grid, SelectChangeEvent } from '@mui/material'
import { AddPositionField, SectionTitle, Space20 } from 'components/Commons'
import React, { ChangeEvent } from 'react'
import { getFieldFormPath, getFieldValue, trlb } from 'utilities'
import { OpStandardMaterialsSubSection, OpStandardMedicationsSubSection } from './CommonsSubSections'
import { useOpStandardManagementContext } from './OpStandardContext'
import { InstructionsListSubSection } from './InstructionsList'
import { FormikProps } from 'formik'
import SectionWrapper from './SectionWrapper'
import OpStandardTablesBar from './OpStandardTablesBar'
import { DynamicTable } from 'pages/OpStandardManagement/components/DynamicTable'

export const Positions = ({
  edit,
  form,
  formPath = '',
  timestampsFormPath = '',
  caseDetails = false,
}: OpStandardTabsProps) => {
  const positions = getFieldValue(form, formPath) ?? []
  const positioning = Object.keys(OpStandardPosition_Name)

  const handleSelectPosition = (value: string, index: number) => {
    form.setFieldValue(`${formPath}[${index}]`, value)
  }

  const handleAdd = () => {
    const index = positions.length
    form.setFieldValue(formPath, [...positions, ''])
    if (caseDetails) form.setFieldValue(`${timestampsFormPath}[${index}]`, new Date())
  }

  const handleRemovePosition = (index: number) => {
    form.setFieldValue(
      formPath,
      positions.filter((_: string, _index: number) => index !== _index),
    )
    const timestampArray = getFieldValue(form, timestampsFormPath) ?? []
    if (caseDetails && timestampArray?.[index]) {
      const newTimestampArray = timestampArray
        .filter((_: string, _index: number) => index !== _index)
      form.setFieldValue(timestampsFormPath, newTimestampArray)
    }
  }

  const isAddAvailable = () => {
    return !positions.some((position: string) => !position)
  }

  const getPositionTimeStamp = (index: number) => {
    const current = (getFieldValue(form, timestampsFormPath) ?? [])[index]

    if (current != null) return current

    return new Date()
  }

  return (
    <SectionWrapper title='positions'>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {positions.map((position: string, index: number) => (
          <React.Fragment key={index + '_' + position}>
            <AddPositionField
              name={index}
              label={trlb('position') + ' ' + (index + 1) + ': ' + position}
              menuItems={positioning.map(_ => ({ label: _, value: _ }))}
              values={positioning.map(_ => ({ label: _, value: _ }))}
              form={form}
              value={position}
              onChange={(e: SelectChangeEvent) =>
                handleSelectPosition(e.target.value as string, index)}
              onDelete={() => handleRemovePosition(index)}
              inputProps={{ readOnly: !edit }}
              disabledDeleteButton={!edit}
              disableTimestamp={!edit}
              showPositionsTimestamps={caseDetails}
              timeStampLabel={trlb('case_tab_intraOp_positionTimestamp')}
              timestampValue={getPositionTimeStamp(index)}
              onTimestampChange={(newValue: Date) => {
                form.setFieldValue(`intraOpSection.positionsTimestamps[${index}]`, newValue)
              }}
              showTimeStamp={undefined}
              section={formPath}
              touched={form.touched.intraOpSection?.positions}
              errors={form.errors.intraOpSection?.positions}
            />
            <Space20 />
          </React.Fragment>
        ))}
        {edit
          ? (
            <Button onClick={() => handleAdd()} disabled={!isAddAvailable()} sx={{ width: 'fit-content' }}>
              <Add />
              {trlb('add_position')}
            </Button>
          )
          : null}
      </Box>
    </SectionWrapper>
  )
}

export const OpStandardEquipmentsSubSection = ({ form, formPath }:
{ form: FormikProps<any>; formPath: string }) => {
  const equipments = getFieldValue(form, formPath) ?? []

  const deleteRows = (indexes: number[]) => {
    form.setFieldValue(
      formPath,
      equipments.filter((_: OpStandardMaterial, _index: number) => !indexes.includes(_index)),
    )
  }

  const addRow = () => {
    form.setFieldValue(formPath, [
      ...equipments,
      {
        name: '',
        amount: '',
        mandatory: false,
        notes: '',
      },
    ])
  }

  return {
    table: true,
    formPath,
    title: 'equipment',
    columns: [
      {
        field: 'name',
        headerName: trlb('equipment_name'),
        flex: 1,
        type: 'text',
      },
      {
        field: 'amount',
        headerName: trlb('createReceipt_amount'),
        type: 'number',
      },
      {
        field: 'prefill',
        headerName: trlb('preFill'),
        type: 'boolean',
      },
      {
        field: 'notes',
        headerName: trlb('formBooking_Notes'),
        flex: 1,
        type: 'text',
      },
    ],
    rows: equipments,
    deleteRows,
    addRow,
    addRowText: 'add_equipment',
  }
}

export const OpStandardSterileGoodsSubSection = ({ form, formPath }:
{ form: FormikProps<any>; formPath: string }) => {
  const { sterileGoods } = useOpStandardManagementContext()
  const opStandardSterileGoods = getFieldValue(form, formPath) ?? []
  const sterileGoodUnits = Object.keys(SterileGoodUnits)
  const sterileGoodUnitOptions = sterileGoodUnits.map(val => ({ label: trlb(val), value: val }))

  const sterileGoodOptions = React.useMemo(
    () => ({
      [SterileGoodUnits.SET]: sterileGoods[SterileGoodUnits.SET].map(sterileGood => ({
        label: sterileGood.label,
        value: sterileGood.id,
        key: sterileGood.key,
      })),
      [SterileGoodUnits.SINGLE_INSTRUMENT]: sterileGoods[SterileGoodUnits.SINGLE_INSTRUMENT]
        .map(sterileGood => ({
          label: sterileGood.label,
          value: sterileGood.id,
          key: sterileGood.key,
        })),
      [SterileGoodUnits.CONTAINER]: sterileGoods[SterileGoodUnits.CONTAINER].map(sterileGood => ({
        label: sterileGood.label,
        value: sterileGood.id,
        key: sterileGood.key,
      })),
    }),
    [sterileGoods],
  )

  const deleteRows = (indexes: number[]) => {
    form.setFieldValue(
      formPath,
      opStandardSterileGoods
        .filter((_: OpStandardSterileGood, _index: number) => !indexes.includes(_index)),
    )
  }

  const addRow = () => {
    form.setFieldValue(formPath, [
      ...opStandardSterileGoods,
      {
        unitType: null,
        sterileGood: null,
        amount: '',
        mandatory: false,
        notes: '',
      },
    ])
  }

  return {
    table: true,
    formPath,
    title: 'intraOp_sterileGoods',
    columns: [
      {
        field: 'unitType',
        headerName: trlb('op_standard_sterile_unit_type'),
        flex: 1,
        type: 'autocomplete',
        options: sterileGoodUnitOptions,
        getOptionLabel: (option: any) => option.label,
        onChange: (value: string, index: number) => {
          form.setFieldValue(getFieldFormPath(formPath, 'unitType', index), value)
          form.setFieldValue(getFieldFormPath(formPath, 'sterileGood', index), '')
        },
      },
      {
        field: 'sterileGood',
        headerName: trlb('op_standard_sterile_good'),
        flex: 1,
        type: 'autocomplete',
        getOptions: (sterileGood: any) =>
          sterileGoodOptions[sterileGood.unitType as SterileGoodUnits] ??
          [],
        getDisabled: (sterileGood: any) => !sterileGood.unitType,
        getOptionLabel: (option: any) => option.label,
      },
      {
        field: 'amount',
        headerName: trlb('createReceipt_amount'),
        type: 'number',
      },
      {
        field: 'prefill',
        headerName: trlb('preFill'),
        type: 'boolean',
      },
      {
        field: 'notes',
        headerName: trlb('formBooking_Notes'),
        flex: 1,
        type: 'text',
      },
    ],
    rows: opStandardSterileGoods,
    deleteRows,
    addRow,
    addRowText: 'add_sterile_good',
  }
}

export const TablesSection = ({
  edit,
  form,
  formPath = '',
  caseDetails,
  columns,
  warningFields,
  showDocumentationWarnings,
  showBillingWarning
}: OpStandardTabsProps & {
  columns?: any
}) => {
  const medications = OpStandardMedicationsSubSection({
    form,
    formPath: formPath + INTRAOPSECTIONS.MEDICATIONS,
    caseDetails,
  })
  const materials = OpStandardMaterialsSubSection({
    form,
    formPath: formPath + INTRAOPSECTIONS.MATERIALS
  })
  const equipments = OpStandardEquipmentsSubSection({
    form,
    formPath: formPath + INTRAOPSECTIONS.EQUIPMENTS,
  })
  const sterilegoods = OpStandardSterileGoodsSubSection({
    form,
    formPath: formPath + INTRAOPSECTIONS.STERILE_GOODS
  })

  const tablesProps = [
    InstructionsListSubSection({ form, formPath: formPath + 'instructions', caseDetails }),
    {
      ...materials,
      warningFields,
      section: `${formPath}materials`,
      columns:
        columns && columns[INTRAOPSECTIONS.MATERIALS]
          ? materials.columns
            .filter(col => columns[INTRAOPSECTIONS.MATERIALS]
              .includes(col.field))
          : materials.columns,
    },
    {
      ...medications,
      warningFields,
      section: `${formPath}medications`,
      columns:
        columns && columns[INTRAOPSECTIONS.MEDICATIONS]
          ? medications.columns
            .filter(col => columns[INTRAOPSECTIONS.MEDICATIONS]
              .includes(col.field))
          : medications.columns,
    },
    {
      ...equipments,
      warningFields,
      section: `${formPath}equipments`,
      columns:
        columns && columns[INTRAOPSECTIONS.EQUIPMENTS]
          ? equipments.columns
            .filter(col => columns[INTRAOPSECTIONS.EQUIPMENTS]
              .includes(col.field))
          : equipments.columns,
    },
    {
      ...sterilegoods,
      warningFields,
      section: `${formPath}sterileGoods`,
      columns:
        columns && columns[INTRAOPSECTIONS.STERILE_GOODS]
          ? sterilegoods.columns
            .filter(col => columns[INTRAOPSECTIONS.STERILE_GOODS]
              .includes(col.field))
          : sterilegoods.columns,
    },
  ]
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DynamicTable
        {...{
          tablesProps: tablesProps.map(tp => ({
            data: tp,
            noAddButtonOnEmpty: true,
          })),
          edit,
          form,
          showDocumentationWarnings,
          showBillingWarning
        }}
      />
      <OpStandardTablesBar tablesProps={tablesProps} edit={edit} />
    </Box>
  )
}

export const Tourniquet = ({ edit, form, formPath = '' }: OpStandardTabsProps) => {
  const handleChange = (value: string | boolean, field: string) => {
    form.setFieldValue(formPath + field, value)
  }
  return (
    <SectionWrapper title='op_standard_tourniquet'>
      <Grid container spacing={2}>
        <Grid container item xs={6} spacing={2}>
          <SectionTitle text={trlb('op_standard_blutleere')} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <FormControlLabel
              control={
                <Checkbox
                  sx={{ fill: '#fff' }}
                  checked={getFieldValue(form, formPath + 'blutleere.required')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    edit && handleChange(e.target.checked, 'blutleere.required')
                  }
                />
              }
              label={trlb('opStandard_sectionRequired')}
              sx={{ marginTop: '5px' }}
            />
          </Box>
        </Grid>
        <Grid container item xs={6} spacing={2}>
          <SectionTitle text={trlb('op_standard_tourniquet')} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <FormControlLabel
              control={
                <Checkbox
                  sx={{ fill: '#fff' }}
                  checked={getFieldValue(form, formPath + 'tourniquet.required')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    edit && handleChange(e.target.checked, 'tourniquet.required')
                  }
                />
              }
              label={trlb('opStandard_sectionRequired')}
              sx={{ marginTop: '5px' }}
            />
          </Box>
        </Grid>
      </Grid>
    </SectionWrapper>
  )
}

export const StandardRequiredSection = ({ edit, form, title, formPath = '' }: OpStandardTabsProps) => {
  const handleChange = (value: string | boolean, field: string) => {
    form.setFieldValue(formPath + field, value)
  }

  return (
    <SectionWrapper title={title!}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <FormControlLabel
          control={
            <Checkbox
              sx={{ fill: '#fff' }}
              checked={getFieldValue(form, formPath + 'required')}
              onChange={(e: ChangeEvent<HTMLInputElement>) => edit && handleChange(e.target.checked, 'required')}
            />
          }
          label={trlb('opStandard_sectionRequired')}
          sx={{ marginTop: '5px' }}
        />
      </Box>
    </SectionWrapper>
  )
}
