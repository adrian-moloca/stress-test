import { IUser, validateInsertedDate } from '@smambu/lib.constants'
import { Grid, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { GridTextField } from 'components/Commons'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'

interface UserAnagraphicsFieldsProps {
  readOnly: boolean
  form: FormikProps<Omit<IUser, 'roleAssociations'>>
  selectedUser: IUser | null
}

const UserAnagraphicsFields = ({ readOnly, form, selectedUser }: UserAnagraphicsFieldsProps) => {
  return (
    <Grid container sx={{ justifyContent: 'center' }} spacing={2}>
      <GridTextField
        label={trlb('userField_Title')}
        xs={selectedUser?.debtorNumber ? 2 : 4}
        disabled={readOnly}
        {...form.getFieldProps('title')}
        error={form.touched.title ? form.errors.title : ''}
      />
      <GridTextField
        label={trlb('userField_Name') + '*'}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps('firstName')}
        error={form.touched.firstName ? form.errors.firstName : ''}
      />
      <GridTextField
        label={trlb('userField_Surname') + '*'}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps('lastName')}
        error={form.touched.lastName ? form.errors.lastName : ''}
      />
      {selectedUser?.debtorNumber != null && (
        <GridTextField label={trlb('userField_DebtorNumber')} xs={2} disabled value={selectedUser.debtorNumber} />
      )}
      <Grid item xs={4}>
        <DatePicker
          inputFormat={trlb('dateTime_date_string')}
          label={trlb('userField_BirthDate')}
          disabled={readOnly}
          onChange={newValue => form.setFieldValue('birthDate', validateInsertedDate(newValue))}
          value={form.values.birthDate}
          renderInput={params => (
            <TextField
              {...params}
              onBlur={form.handleBlur('birthDate')}
              error={Boolean(form.touched.birthDate && form.errors.birthDate)}
              helperText={form.touched.birthDate ? form.errors.birthDate : ''}
            />
          )}
        />
      </Grid>
      <GridTextField
        label={trlb('userField_PhoneNumber')}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps('phoneNumber')}
        error={form.touched.phoneNumber ? form.errors.phoneNumber : ''}
      />
      <GridTextField
        label={trlb('userField_Email') + '*'}
        xs={4}
        disabled={readOnly}
        {...form.getFieldProps('email')}
        error={form.touched.email ? form.errors.email : ''}
      />
    </Grid>
  )
}

export default UserAnagraphicsFields
