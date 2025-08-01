import React from 'react'
import AuthLayout from 'layouts/AuthLayout'
import { Box, Button, TextField } from '@mui/material'
import logo from '../../../assets/img/LogoSMAMBU.png'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useResetPassword } from 'hooks'
import { useLocation } from 'react-router-dom'
import { trlb } from 'utilities'

export const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('resetPassword_password_required')
    .matches(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.,_]).{8,}$/,
      'resetPassword_minimumRequirements_error',
    ),
  confirm: Yup.string()
    .required('resetPassword_confirm_required')
    .oneOf([Yup.ref('password')], 'resetPassword_passwordsDoNotMatch_error')
    .matches(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.,_]).{8,}$/,
      'resetPassword_minimumRequirements_error',
    ),
})

const ResetPassword = () => {
  const location = useLocation()
  const resetPassword = useResetPassword()

  // @ts-ignore
  const onSubmit = async (values: { password: string }) => {
    const params = location.search.slice(1).split('=')
    const token = params ? params[1] : ''

    resetPassword({
      password: values.password,
      token,
    })
  }

  const form = useFormik({
    validateOnMount: true,
    initialValues: {
      password: '',
      confirm: '',
    },
    validationSchema: ResetPasswordSchema,
    onSubmit,
  })

  return (
    <AuthLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <img src={logo} width={160} />
      </Box>

      <form onSubmit={form.handleSubmit}>
        <Box sx={{ mb: 4 }}>
          <TextField
            type='password'
            label='Password'
            variant='outlined'
            sx={{ width: '100%' }}
            error={form.dirty && !!form.errors.password}
            helperText={form.dirty && trlb(form.errors.password ?? '')}
            {...form.getFieldProps('password')}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            type='password'
            label='Confirm'
            variant='outlined'
            sx={{ width: '100%' }}
            error={form.dirty && !!form.errors.confirm}
            helperText={form.dirty && trlb(form.errors.confirm ?? '')}
            {...form.getFieldProps('confirm')}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', align: 'items-center' }} mb={1}>
          <Button color='primary' variant='contained' type='submit' disabled={form.isSubmitting || !form.isValid}>
            {trlb('resetPassword_button')}
          </Button>
        </Box>
      </form>
    </AuthLayout>
  )
}

export default ResetPassword
