import React from 'react'
import { OperatingRoomStatus } from '@smambu/lib.constants'
import { Typography, Box, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material'
import { trlb } from 'utilities/translator/translator'
import { FlexDateSelector } from 'components/FlexCommons'
import { SectionTitle } from 'components/Commons'
import { FormikProps } from 'formik'
import { defaultStyles } from 'ThemeProvider'
import { TOrInitialValues } from 'pages/OrManagementPage'

const RoomStatus = ({ form, canEditOr }:
{ form: FormikProps<TOrInitialValues>; canEditOr: boolean }) => {
  return (
    <>
      <SectionTitle text={trlb('room_status')} />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '25px',
        }}
      >
        <FormControl>
          <InputLabel>{trlb('calendarCard_status')}</InputLabel>
          <Select
            label={trlb('calendarCard_status')}
            sx={{ maxHeight: '60px', minWidth: '200px' }}
            key={form.values.status}
            name='status'
            value={form.values.status}
            disabled={!canEditOr}
            required
            error={form.touched.status ? !!form.errors.status : false}
            onChange={e => form.setFieldValue('status', e.target.value)}
            onBlur={form.handleBlur}
            onClose={() => {
              setTimeout(() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
              }, 0)
            }}
            MenuProps={defaultStyles.MenuProps}
          >
            {Object.values(OperatingRoomStatus).map(status => {
              return (
                <MenuItem value={status} key={status} sx={defaultStyles.MenuItemSx}>
                  {trlb(`opRoomStatus_${status}`)}
                </MenuItem>
              )
            })}
          </Select>
          {form.errors.status && form.touched.status && (
            <FormHelperText sx={{ color: theme => theme.palette.error.main, marginLeft: '16px !important' }}>
              {form.errors?.status ?? ''}
            </FormHelperText>
          )}
        </FormControl>
        <Typography variant='subtitle1' sx={{ margin: '0px 20px' }}>
          {trlb('commons_from')}
        </Typography>
        <FlexDateSelector
          value={form.values.exception?.startDate}
          onChange={value => {
            return value ? form.setFieldValue('exception.startDate', value) : {}
          }}
          label={'commons_start_date'}
          canEdit={canEditOr}
          error={Boolean(form.touched?.exception?.startDate && form.errors?.exception?.startDate)}
        />
        <Typography variant='subtitle1' sx={{ margin: '0px 20px' }}>
          {trlb('commons_to')}
        </Typography>
        <FlexDateSelector
          value={form.values.exception?.endDate}
          onChange={value => (value ? form.setFieldValue('exception.endDate', value) : {})}
          label='commons_end_date'
          canEdit={canEditOr}
          error={Boolean(form.touched?.exception?.endDate && form.errors?.exception?.endDate)}
        />
      </Box>
    </>
  )
}
export default RoomStatus
