import React from 'react'
import { PERMISSIONS_DOMAINS_SCOPES, I_PERMISSIONS_DOMAINS_SCOPES, tPermissionDomains, Role } from '@smambu/lib.constants'
import { GridTextField, GridSelect, SectionTitle, Panel } from 'components/Commons'
import { trlb } from 'utilities'
import { Grid } from '@mui/material'
import { FormikProps } from 'formik'

const RoleInformation = ({
  edit,
  form,
  domains,
}: {
  edit?: boolean
  form: FormikProps<Partial<Role>>
  domains: tPermissionDomains
}) => {
  const [name, setName] = React.useState(form.values?.name ?? '')

  React.useEffect(() => {
    setName(form.values.name)
  }, [form.values.name])

  React.useEffect(() => {
    if (edit && name !== form.values.name) {
      const timeout = setTimeout(() => {
        form.setFieldValue('name', name)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [name, edit, form])

  const changeScope = async (scope: I_PERMISSIONS_DOMAINS_SCOPES) => {
    await form.setFieldValue('scope', scope)

    const domainScopes = Object.fromEntries(Object.entries(domains).map(([key]) => [key, scope]))
    await form.setFieldValue('domain_scopes', domainScopes)
  }

  return (
    <>
      <SectionTitle text={trlb('role_information')} sx={{ my: 1 }} />
      <Panel sx={{ p: 2 }}>
        <Grid container xs={12} sx={{ justifyContent: 'center' }} spacing={2}>
          <GridTextField
            value={name}
            onChange={(event: any) => setName(event.target.value)}
            onBlur={() => form.setFieldTouched('name', true)}
            name='name'
            xs={6}
            label={trlb('role_name')}
            disabled={!edit}
            error={form.touched.name ? form.errors.name : ''}
          />
          <GridSelect
            xs={6}
            label={trlb('can_access_data_of')}
            menuItems={Object.values(PERMISSIONS_DOMAINS_SCOPES)
              .map(el => ({ value: el, label: trlb(el) }))}
            onChange={(event: any) => changeScope(event
              .target
              .value as I_PERMISSIONS_DOMAINS_SCOPES)}
            onClose={() => form.setFieldTouched('scope', true)}
            value={form.getFieldProps('scope').value ?? ''}
            disabled={!edit}
            error={form.touched.scope ? form.errors.scope : ''}
            helperText={form.touched.scope ? form.errors.scope : ''}
          />
        </Grid>
      </Panel>
    </>
  )
}

export default RoleInformation
