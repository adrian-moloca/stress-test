import { AnesthesiologistOpStandard, Measures } from '@smambu/lib.constants'
import { Checkbox, FormControlLabel, Grid } from '@mui/material'
import { Panel } from 'components/Commons'
import { FormikProps } from 'formik'
import { fieldNameOf } from 'pages/AnestesiologistOPStandardList'
import React from 'react'
import { trlb } from 'utilities'

export const InterOperativeMeasures = ({
  edit,
  form,
  values,
  section = '',
}: {
  edit: boolean
  form: FormikProps<AnesthesiologistOpStandard>
  values: Measures[]
  section: string
}) => {
  const onChange = (name: string, checked: boolean) => {
    const currMeasures: Measures[] = values

    if (checked)
      form.setFieldValue(`${section}${fieldNameOf<AnesthesiologistOpStandard>('interoperativeMeasure')}`, [
        ...currMeasures,
        name,
      ])
    else
      form.setFieldValue(
        `${section}${fieldNameOf<AnesthesiologistOpStandard>('interoperativeMeasure')}`,
        currMeasures.filter(f => f !== name),
      )
  }

  return (
    <Panel>
      <Grid container sx={{ justifyContent: 'center' }}>
        {Object.values(Measures).map(service => (
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
