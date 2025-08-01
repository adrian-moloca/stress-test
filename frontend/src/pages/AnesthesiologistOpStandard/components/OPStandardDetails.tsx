import { AnesthesiologistOpStandard, IUser, getFullName, permissionRequests } from '@smambu/lib.constants'
import { Grid } from '@mui/material'
import { FormikErrors, FormikProps, FormikTouched } from 'formik'
import { fieldNameOf } from 'pages/AnestesiologistOPStandardList'
import React from 'react'
import { FormikGridTextField, GridDateSelector, GridTextField, Panel, Space20 } from 'components/Commons'
import { trlb } from 'utilities/translator/translator'
import { useGetUserDetails } from 'hooks/userHooks'
import { useAppSelector } from 'store'
import { useGetCheckPermission } from 'hooks/userPermission'

export const OPStandardDetails = ({
  edit,
  form,
  values,
  errors,
  touched,
}: {
  edit: boolean
  form: FormikProps<AnesthesiologistOpStandard>
  values: AnesthesiologistOpStandard
  errors: FormikErrors<AnesthesiologistOpStandard>
  touched: FormikTouched<AnesthesiologistOpStandard>
}) => {
  const checkPermission = useGetCheckPermission()
  const canViewUser = checkPermission(permissionRequests.canViewUser, {
    user: {
      id: values.createdBy
    }
  })
  const getUserDetails = useGetUserDetails()
  const authUser = useAppSelector(state => state.auth.user)
  const [userDetails, setUserDetails] = React.useState<IUser>()

  React.useEffect(() => {
    if (values.createdBy && values.createdBy === authUser.id) setUserDetails(authUser)
    else if (values.createdBy && canViewUser)
      getUserDetails(values.createdBy).then((res: IUser) => {
        setUserDetails(res)
      })
  }, [authUser, values.createdBy, canViewUser])
  const section = ''

  return (
    <Panel>
      <Grid container spacing={2} sx={{ maxWidth: '90%', mx: 'auto' }}>
        <FormikGridTextField
          xs={6}
          label={trlb('op_standard_name')}
          values={values}
          form={form}
          section={section}
          touched={touched}
          errors={errors}
          name={fieldNameOf<AnesthesiologistOpStandard>('name')}
          inputProps={{ readOnly: !edit }}
        />
        <GridDateSelector
          label={trlb('valid_from')}
          xs={6}
          value={form.values.validFrom}
          onChange={date => form.setFieldValue('validFrom', date)}
          onBlur={() => form.setFieldTouched('validFrom', true)}
          error={touched.validFrom && Boolean(errors.validFrom)}
          helperText={touched.validFrom && errors.validFrom ? String(errors.validFrom) : ''}
          disabled={!edit}
        />
        {!edit && canViewUser
          ? (
            <GridTextField xs={12} label={trlb('created_by_user')} value={getFullName(userDetails, true)} inputProps={{ readOnly: !edit }} />
          )
          : null}
        <Space20 />
      </Grid>
    </Panel>
  )
}
