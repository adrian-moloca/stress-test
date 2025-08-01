import { Grid, Typography } from '@mui/material'
import { FormikGridSelect, Panel } from 'components/Commons'
import { trlb } from 'utilities'
import React from 'react'
import { FormikErrors, FormikProps, FormikTouched } from 'formik'
import { AnesthesiologistOpStandard, OpStandardPosition_Name } from '@smambu/lib.constants'
import { fieldNameOf } from 'pages/AnestesiologistOPStandardList'
import { TextIconButton } from 'components/Buttons'
import AddIcon from '@mui/icons-material/Add'
import { Clear } from '@mui/icons-material'

export const Positions = ({
  edit,
  form,
  values,
  errors,
  touched,
  section = '',
}: {
  edit: boolean
  form: FormikProps<AnesthesiologistOpStandard>
  values: OpStandardPosition_Name[]
  errors?: string | string[]
  touched?: boolean
  section?: string
}) => {
  const addPosition = () => {
    form.setFieldValue(`${section}${fieldNameOf<AnesthesiologistOpStandard>('positions')}`, [...values, ''])
  }

  const updatePositions = (value: OpStandardPosition_Name, index: number) => {
    values[index] = value
    form.setFieldValue(`${section}${fieldNameOf<AnesthesiologistOpStandard>('positions')}`, values)
  }

  const removePosition = (index: number) => {
    values.splice(index, 1)
    form.setFieldValue(`${section}${fieldNameOf<AnesthesiologistOpStandard>('positions')}`, values)
  }

  return (
    <Grid container xs={!edit ? 12 : 11} spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      {(values || []).map((val, index) => (
        <Panel key={`${val}_${index}`}>
          <Grid xs={12} item container>
            <FormikGridSelect
              label={trlb('position')}
              xs={11}
              {...{
                disabled: !edit,
                form,
                section,
                errors: errors as unknown as FormikErrors<any>,
                values,
                touched: touched as unknown as FormikTouched<any>,
                name: fieldNameOf<AnesthesiologistOpStandard>('positions'),
                menuItems: Object.keys(OpStandardPosition_Name).map(position => ({
                  label: position,
                  value: position,
                })),
                onChange: e => updatePositions(e.target.value as OpStandardPosition_Name, index),
                value: values[index],
              }}
            />
            {edit
              ? (
                <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                  <TextIconButton onClick={() => removePosition(index)} icon={<Clear sx={{ marginRight: '10px' }} />} />
                </Grid>
              )
              : null}
          </Grid>
        </Panel>
      ))}
      {!edit && values.length === 0
        ? (
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Typography variant='body1'>{trlb('op_standard_noValues')}</Typography>
          </Grid>
        )
        : null}
      {edit && !errors
        ? (
          <Grid item sx={{ justifyContent: 'center', alignContent: 'center' }}>
            <div style={{ display: 'flex' }}>
              <TextIconButton
                onClick={addPosition}
                text={trlb('add_position')}
                icon={<AddIcon sx={{ marginRight: '10px' }} />}
              />
            </div>
          </Grid>
        )
        : null}
    </Grid>
  )
}
