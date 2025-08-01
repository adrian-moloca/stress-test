import { Box, Checkbox, Divider, FormControlLabel, Grid, TextField, Typography } from '@mui/material'
import { GridAutocomplete, NumericTextField, Panel, SectionTitle, Space40 } from 'components/Commons'
import { trlb } from 'utilities'
import { SurgerySlots } from './SurgerySlots'
import { DatePicker } from '@mui/x-date-pickers'
import { FormikProps } from 'formik'
import { Contract, IUser, Identifier, getFullName, validateInsertedDate } from '@smambu/lib.constants'
import React, { useEffect, useState } from 'react'
import { endOfDay, isValid, startOfDay } from 'date-fns'

interface DetailsAccordionContentProps {
  edit: boolean
  isNew?: boolean
  doctors: Record<Identifier, IUser>
  form: FormikProps<Omit<Contract, 'contractId'>>
  handleSelectDoctor: (doctor?: IUser) => void
  contractsErrors: string[]
}

interface IDoctorLabel {
  firstName?: string
  lastName?: string
}

export const DetailsAccordionContent: React.FC<DetailsAccordionContentProps> = ({
  edit,
  isNew,
  doctors,
  form,
  handleSelectDoctor,
  contractsErrors,
}) => {
  const [selected, setSelected] = useState<IDoctorLabel>({})

  useEffect(() => {
    const _doctor = Object.values(doctors)
      ?.find(doctor => doctor.id === form?.values?.details?.doctorId)

    if (_doctor) setSelected(_doctor)
  }, [doctors, form?.values?.details?.doctorId, setSelected])

  return (
    <Grid container spacing={4}>
      <Grid item xs={6}>
        <Panel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <SectionTitle text={trlb('contract_info')} />
            <TextField
              label={trlb('contract_name') + '*'}
              fullWidth
              {...form.getFieldProps('details.contractName')}
              error={!!form.touched?.details?.contractName && !!form.errors?.details?.contractName}
              helperText={!!form.touched?.details?.contractName && trlb(form.errors?.details?.contractName ?? '')}
              disabled={!edit}
            />
            <GridAutocomplete
              xs={12}
              disabled={!edit || !isNew}
              label={trlb('formBooking_Doctor') + '*'}
              options={Object.values(doctors)}
              {...form.getFieldProps('details.doctorId')}
              name='details.doctorId'
              onSelectValue={(_e, doctor) => handleSelectDoctor(doctor)}
              getOptionLabel={option => option?.firstName != null ? getFullName(option, true) : ''}
              selected={selected as string}
              warning={
                form.touched?.details?.doctorId && form.errors?.details?.doctorId
                  ? trlb(form.errors?.details?.doctorId)
                  : undefined
              }
              error={!!form.touched?.details?.doctorId && !!form.errors?.details?.doctorId}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.getFieldProps('details.kassenzulassung').value}
                  onChange={e => {
                    form.setFieldValue('details.kassenzulassung', e.target.checked)
                  }}
                />
              }
              label={trlb('kassenzulassung')}
              disabled={!edit}
            />
            <Grid>
              <DatePicker
                inputFormat={trlb('dateTime_date_string')}
                label={trlb('contract_valid_from')}
                disabled={!edit}
                onChange={value => form.setFieldValue('details.validFrom', validateInsertedDate(value))}
                minDate={new Date()}
                maxDate={form.values?.details?.validUntil}
                value={form.values?.details?.validFrom}
                renderInput={params => (
                  <TextField
                    {...params}
                    onBlur={() => {
                      form.handleBlur('details.validFrom')
                      if (isValid(form.values?.details?.validFrom))
                        form.setFieldValue('details.validFrom', startOfDay(form.values?.details?.validFrom))
                    }}
                    error={Boolean(form.errors?.details?.validFrom)}
                    helperText={trlb(form.errors?.details?.validFrom ?? '')}
                  />
                )}
              />
            </Grid>
            <Grid>
              <DatePicker
                inputFormat={trlb('dateTime_date_string')}
                label={trlb('contract_valid_until')}
                disabled={!edit}
                onChange={value => form.setFieldValue('details.validUntil', validateInsertedDate(value))}
                value={form.values?.details?.validUntil}
                minDate={form.values?.details?.validFrom}
                renderInput={params => (
                  <TextField
                    {...params}
                    onBlur={() => {
                      form.handleBlur('details.validUntil')
                      if (isValid(form.values?.details?.validUntil))
                        form.setFieldValue('details.validUntil', endOfDay(form.values?.details?.validUntil))
                    }}
                    error={Boolean(form.errors?.details?.validUntil)}
                    helperText={trlb(form.errors?.details?.validUntil ?? '')}
                  />
                )}
              />
            </Grid>
            {contractsErrors.map((error, index) => (
              <Typography key={index} color='error.main'>
                {trlb(error)}
              </Typography>
            ))}
          </Box>
        </Panel>
      </Grid>
      <Grid item xs={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <SectionTitle text={trlb('overnight_stay_fees')} />
          <NumericTextField
            label={'1 ' + trlb('bed_room_fee')}
            fullWidth
            disabled={!edit}
            value={form.values?.details?.overnightStayFee1Bed ?? ''}
            name='details.overnightStayFee1Bed'
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={!!form.errors?.details?.overnightStayFee1Bed}
            helperText={form.errors?.details?.overnightStayFee1Bed}
            isPrice
          />
          <NumericTextField
            label={'2 ' + trlb('beds_room_fee')}
            fullWidth
            disabled={!edit}
            value={form.values?.details?.overnightStayFee2Bed ?? ''}
            name='details.overnightStayFee2Bed'
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={!!form.errors?.details?.overnightStayFee2Bed}
            helperText={form.errors?.details?.overnightStayFee2Bed}
            isPrice
          />
          <NumericTextField
            label={'3 ' + trlb('beds_room_fee')}
            fullWidth
            disabled={!edit}
            value={form.values?.details?.overnightStayFee3Bed ?? ''}
            name='details.overnightStayFee3Bed'
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={!!form.errors?.details?.overnightStayFee3Bed}
            helperText={form.errors?.details?.overnightStayFee3Bed}
            isPrice
          />
        </Box>
      </Grid>
      <Space40 />
      <Divider />
      <SurgerySlots {...{ edit, form }} />
    </Grid>
  )
}
