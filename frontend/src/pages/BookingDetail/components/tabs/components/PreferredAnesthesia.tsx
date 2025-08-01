import { CaseForm, OpStandard } from '@smambu/lib.constants'
import { Grid, Typography } from '@mui/material'
import { FormikGridSelect, Panel, Space20 } from 'components/Commons'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'

const PreferredAnesthesia = ({
  form,
  readOnly,
  opStandard,
}: {
  form: FormikProps<CaseForm>
  opStandard: OpStandard
  readOnly: boolean
}) => {
  const anesthesiaList = opStandard?.bookingSection?.anesthesiaList

  // This is necessary so the user can normalize the old cases without preferredAnesthesia
  const [disabled] = React.useState(
    !!form.values._id &&
    (anesthesiaList?.length === 0 || form.values.surgerySection.preferredAnesthesia != null),
  )

  if (anesthesiaList == null || anesthesiaList.length === 0) return null

  const menuItems = anesthesiaList.map(item => ({
    value: item.anesthesiaType,
    label: trlb(item.anesthesiaType),
  }))

  return (
    <Grid
      item
      xs={6}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingRight: '16px',
      }}
    >
      <Panel>
        <Typography variant='body1' sx={{ textAlign: 'center' }}>
          {trlb(
            disabled
              ? 'booking_tab_surgery_preferredAnesthesia_selected'
              : 'booking_tab_surgery_preferredAnesthesia_select',
          )}
        </Typography>
        <Space20 />
        <FormikGridSelect
          {...{
            label: trlb('booking_tab_surgery_preferredAnesthesia'),
            menuItems,
            values: form.values.surgerySection,
            form,
            section: 'surgerySection',
            name: 'preferredAnesthesia',
            touched: form.touched.surgerySection,
            errors: form.errors.surgerySection,
            disabled: readOnly || disabled,
          }}
        />
      </Panel>
    </Grid>
  )
}

export default PreferredAnesthesia
