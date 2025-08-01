import { AnesthesiologistOpStandard, PreExistingCondition } from '@smambu/lib.constants'
import { Grid, FormControlLabel, Checkbox } from '@mui/material'
import { Panel } from 'components/Commons'
import { FormikProps } from 'formik'
import { fieldNameOf } from 'pages/AnestesiologistOPStandardList'
import React from 'react'
import { trlb } from 'utilities'

export const PreExistingConditions = ({
  edit,
  form,
  values,
}: {
  edit: boolean
  form: FormikProps<AnesthesiologistOpStandard>
  values: PreExistingCondition[]
}) => {
  const onChange = (name: string, checked: boolean) => {
    const currMeasures: PreExistingCondition[] = form.values.preExistingConditions

    if (checked)
      form.setFieldValue(fieldNameOf<AnesthesiologistOpStandard>('preExistingConditions'), [...currMeasures, name])
    else
      form.setFieldValue(
        fieldNameOf<AnesthesiologistOpStandard>('preExistingConditions'),
        currMeasures.filter(f => f !== name),
      )
  }

  return (
    <Panel>
      <Grid container sx={{ justifyContent: 'center' }}>
        {Object.values(PreExistingCondition).map(service => (
          <FormControlLabel
            key={service}
            control={
              <Checkbox
                sx={{ fill: '#fff' }}
                checked={values?.includes(service)}
                onChange={e => onChange(service, e.target.checked)}
                disabled={!edit}
              />
            }
            label={trlb(service)}
            sx={{ marginTop: '5px' }}
          />
        ))}
      </Grid>
    </Panel>
  )
}
