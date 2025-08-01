import { AnesthesiologicalService, AnesthesiologistOpStandard } from '@smambu/lib.constants'
import { Checkbox, FormControlLabel, Grid } from '@mui/material'
import { Panel, SectionSubtitle } from 'components/Commons'
import { FormikProps } from 'formik'
import { fieldNameOf } from 'pages/AnestesiologistOPStandardList'
import React from 'react'
import { routes } from 'routes/routes'
import { trlb } from 'utilities'

export const OPStandardAnesthesiologicalServices = ({
  edit,
  form,
  values,
  section = '',
}: {
  edit: boolean
  form: FormikProps<AnesthesiologistOpStandard>
  values: AnesthesiologicalService[]
  name: keyof AnesthesiologistOpStandard
  section: string
}) => {
  const pathName = location.pathname

  let sectionTitle
  switch (pathName) {
    case routes.anesthesiologistOPStandardDetails:
      sectionTitle = 'required_anest_services'
      break

    case routes.editAnesthesiologistOPStandard:
      sectionTitle = 'select_anest_services'
      break

    case routes.addNewAnesthesiologistOPStandard:
      sectionTitle = 'select_all_required_anest_services'
      break

    default:
      sectionTitle = ''
      break
  }

  const onChange = (name: string, checked: boolean) => {
    const currServices: AnesthesiologicalService[] = values

    if (checked)
      form.setFieldValue(`${section}${fieldNameOf<AnesthesiologistOpStandard>('requiredServices')}`, [
        ...currServices,
        name,
      ])
    else
      form.setFieldValue(
        `${section}${fieldNameOf<AnesthesiologistOpStandard>('requiredServices')}`,
        currServices.filter(f => f !== name),
      )
  }

  return (
    <Panel>
      <Grid container sx={{ justifyContent: 'center', maxWidth: '90%' }}>
        <SectionSubtitle text={trlb(sectionTitle)} />
        <>
          {Object.keys(AnesthesiologicalService).map(service => (
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
        </>
      </Grid>
    </Panel>
  )
}
