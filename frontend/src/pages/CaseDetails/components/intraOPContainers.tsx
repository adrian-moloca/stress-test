import { CaseForm, DrainageSide, OpStandard } from '@smambu/lib.constants'
import { Box, Grid, Checkbox, FormControlLabel, Typography, IconButton } from '@mui/material'
import { GridNumericField, GridSelect, GridTextField, SectionTitle } from 'components/Commons'
import { FormikProps } from 'formik'
import { trlb } from 'utilities'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import React, { ChangeEvent } from 'react'

export const TourniquetContainer = ({
  form,
  edit,
  opStandard,
}: {
  form: FormikProps<CaseForm>
  edit: boolean
  opStandard: OpStandard
}) => {
  const handleChange = (value: string, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }

  return (
    <Grid
      container
      spacing={2}
      sx={{
        justifyContent: 'center',
        display: 'flex',
      }}
    >
      {opStandard.intraOpSection?.tourniquet?.blutleere?.required && (
        <Grid container item xs={6} spacing={2}>
          <SectionTitle text={trlb('op_standard_blutleere')} />
          <GridNumericField
            xs={12}
            name={'mmHg'}
            label={trlb('op_standard_mmHg')}
            value={form.values.intraOpSection?.tourniquet?.blutleere?.mmHg}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'tourniquet.blutleere.mmHg')}
            noDecimalLimit
            inputProps={{ readOnly: !edit, min: 0 }}
          />
          <GridTextField
            xs={12}
            name={'from'}
            label={trlb('op_standard_from')}
            value={form.values.intraOpSection?.tourniquet?.blutleere?.from}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'tourniquet.blutleere.from')}
            inputProps={{ readOnly: !edit }}
          />
          <GridTextField
            xs={12}
            name={'to'}
            label={trlb('op_standard_to')}
            value={form.values.intraOpSection?.tourniquet?.blutleere?.to}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'tourniquet.blutleere.to')}
            inputProps={{ readOnly: !edit }}
          />
        </Grid>
      )}
      {opStandard.intraOpSection?.tourniquet?.tourniquet?.required && (
        <Grid container item xs={6} spacing={2}>
          <SectionTitle text={trlb('op_standard_tourniquet')} />
          <GridNumericField
            xs={12}
            name={trlb('op_standard_mmHg')}
            label={trlb('op_standard_mmHg')}
            value={form.values.intraOpSection?.tourniquet?.tourniquet?.mmHg}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'tourniquet.tourniquet.mmHg')}
            inputProps={{ readOnly: !edit, min: 0 }}
            noDecimalLimit
          />
          <GridTextField
            xs={12}
            name={trlb('op_standard_from')}
            label={trlb('op_standard_from')}
            value={form.values.intraOpSection?.tourniquet?.tourniquet?.from}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'tourniquet.tourniquet.from')}
            inputProps={{ readOnly: !edit }}
          />
          <GridTextField
            xs={12}
            name={trlb('op_standard_to')}
            label={trlb('op_standard_to')}
            value={form.values.intraOpSection?.tourniquet?.tourniquet?.to}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'tourniquet.tourniquet.to')}
            inputProps={{ readOnly: !edit }}
          />
        </Grid>
      )}
    </Grid>
  )
}

export const XrayContainer = ({ form, edit }: { form: FormikProps<CaseForm>; edit: boolean }) => {
  const handleChange = (value: string, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }

  return (
    <div style={{ width: '100%' }}>
      <Grid container spacing={2}>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                sx={{ fill: '#fff' }}
                checked={form.values.intraOpSection?.x_ray?.c_arm}
                onChange={e => edit && handleChange(e.target.checked, 'x_ray.c_arm')}
                disabled={!edit}
              />
            }
            label={trlb('op_standard_c_arm')}
            sx={{ marginTop: '5px' }}
          />
        </Grid>
        <GridTextField
          xs={6}
          name={'mGycm'}
          label={trlb('op_standard_mGycm')}
          value={form.values.intraOpSection?.x_ray?.mGycm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'x_ray.mGycm')}
          inputProps={{ readOnly: !edit }}
        />
      </Grid>
    </div>
  )
}

export const DrainageContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const options = Object.keys(DrainageSide).map(val => ({
    label: trlb(val),
    value: val,
  }))

  const handleChange = (value: string, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }

  return (
    <div style={{ width: '100%' }}>
      <Grid container spacing={2}>
        <GridSelect
          xs={12}
          name={'drainage'}
          label={trlb('op_standard_drainage')}
          menuItems={options}
          value={form.values.intraOpSection?.drainage?.drainage ?? ''}
          onChange={e => handleChange(e.target.value as string, 'drainage.drainage')}
          inputProps={{ readOnly: !edit }}
        />
      </Grid>
    </div>
  )
}

export const MonopolarContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const handleChange = (value: string, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }
  const options = Object.keys(DrainageSide).map(val => ({
    label: trlb(val),
    value: val,
  }))

  return (
    <div style={{ width: '100%' }}>
      <Grid container spacing={2}>
        <GridSelect
          xs={12}
          name={'monopolar'}
          label={trlb('op_standard_monopolar')}
          menuItems={options}
          value={form.values.intraOpSection?.monopolar?.monopolar ?? ''}
          onChange={e => handleChange(e.target.value as string, 'monopolar.monopolar')}
          inputProps={{ readOnly: !edit }}
        />
      </Grid>
    </div>
  )
}

export const BipolarContainer = ({ form, edit }) => {
  const handleChange = (value: string, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }

  return (
    <div style={{ width: '100%' }}>
      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              sx={{ fill: '#fff' }}
              checked={form.values.intraOpSection?.bipolar?.bipolar}
              onChange={e => edit && handleChange(e.target.checked, 'bipolar.bipolar')}
              disabled={!edit}
            />
          }
          label={trlb('case_tab_intraOP_performed')}
          sx={{ marginTop: '5px' }}
        />
      </Grid>
    </div>
  )
}

export const HistologyContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const handleChange = (value: string, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }

  return (
    <div style={{ width: '100%' }}>
      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              sx={{ fill: '#fff' }}
              checked={form.values.intraOpSection?.histology?.histology}
              onChange={e => edit && handleChange(e.target.checked, 'histology.histology')}
              disabled={!edit}
            />
          }
          label={trlb('case_tab_intraOP_performed')}
          sx={{ marginTop: '5px' }}
        />
      </Grid>
    </div>
  )
}

export const BacteriologyContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const handleChange = (value: string, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }
  return (
    <div style={{ width: '100%' }}>
      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              sx={{ fill: '#fff' }}
              checked={form.values.intraOpSection?.bacteriology?.bacteriology}
              onChange={e => edit && handleChange(e.target.checked, 'bacteriology.bacteriology')}
              disabled={!edit}
            />
          }
          label={trlb('case_tab_intraOP_performed')}
          sx={{ marginTop: '5px' }}
        />
      </Grid>
    </div>
  )
}

export const CountControlContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const handleChange = (value: number, field: string) => {
    form.setFieldValue('intraOpSection.' + field, value)
  }
  return (
    <Grid
      container
      spacing={2}
      sx={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {form.values.snapshottedCountControl?.length != null
        ? (
          <>
            <Grid
              item
              xs={5}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant='h6'>{trlb('case_tab_intraOP_CountControl_before')}</Typography>
              {form.values?.snapshottedCountControl?.map((item, index) => (
                <Item
                  key={item + index}
                  name={item}
                  value={form.values.intraOpSection?.countControl?.before?.[item + index]}
                  onChange={newValue => handleChange(newValue, `countControl.before[${item + index}]`)}
                  disabled={!edit}
                />
              ))}
            </Grid>
            <Grid
              item
              xs={5}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant='h6'>{trlb('case_tab_intraOP_CountControl_after')}</Typography>
              {form.values?.snapshottedCountControl?.map((item, index) => (
                <Item
                  key={item + index}
                  name={item}
                  value={form.values.intraOpSection?.countControl?.after?.[item + index]}
                  onChange={newValue => handleChange(newValue, `countControl.after[${item + index}]`)}
                  disabled={!edit}
                />
              ))}
            </Grid>
          </>
        )
        : (
          <Typography variant='body2' sx={{ color: 'red', mt: 1 }}>
            {trlb('case_tab_intraOP_CountControl_disabled')}
          </Typography>
        )}
    </Grid>
  )
}

const Item = ({
  name,
  onChange,
  value,
  disabled,
}: {
  name: string
  onChange: (newValue: number) => void
  value: number
  disabled: boolean
}) => {
  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      sx={{
        width: '100%',
      }}
    >
      <Box>
        <Typography
          sx={{
            marginRight: '50px',
          }}
        >
          {name}
        </Typography>
      </Box>
      <Box display='flex' alignItems='center'>
        <IconButton onClick={() => onChange(value - 1 >= 0 ? value - 1 : 0)} disabled={disabled}>
          <RemoveIcon />
        </IconButton>
        <Typography
          sx={{
            fontWeight: 'bold',
          }}
        >
          {value ?? 0}
        </Typography>
        <IconButton onClick={() => {
          let changeValue
          if (value == null) changeValue = 1
          else
            if (value + 1 >= 0) changeValue = value + 1
            else changeValue = 0

          onChange(changeValue)
        }}
        disabled={disabled}>
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  )
}
