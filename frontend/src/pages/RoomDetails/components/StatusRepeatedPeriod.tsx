import React from 'react'
import { Weekdays, weekdaysList } from '@smambu/lib.constants'
import { Box, FormControlLabel, Checkbox } from '@mui/material'
import { trlb } from 'utilities/translator/translator'
import { FormikProps } from 'formik'
import { TOrInitialValues } from 'pages/OrManagementPage'

const StatusRepeatedPeriod = ({
  form,
  showDays,
  setShowDays,
  canEditOr,
}: {
  form: FormikProps<TOrInitialValues>
  showDays: boolean
  setShowDays: (value: boolean) => void
  canEditOr: boolean
}) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          margin: '10px',
          marginBottom: '20px',
        }}
      >
        <FormControlLabel
          control={<Checkbox />}
          label={trlb('repeat_in_the_period')}
          checked={showDays}
          onChange={() => setShowDays(!showDays)}
          disabled={!canEditOr}
        />
      </Box>
      {showDays
        ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {weekdaysList.map(day => (
              <FormControlLabel
                key={day}
                control={<Checkbox />}
                disabled={!canEditOr}
                label={trlb(`dateTime_${day}`)}
                checked={Object.values(form.values.exception?.repeatedEvery || []).some(
                  element => element === Weekdays[day as keyof typeof Weekdays],
                )}
                onChange={(_e, checked) => {
                  if (checked) {
                    const current = form.values.exception?.repeatedEvery || []
                    let updated = current.concat(Weekdays[day as keyof typeof Weekdays])

                    form.setFieldValue('exception.repeatedEvery', updated)
                  } else {
                    form.setFieldValue(
                      'exception.repeatedEvery',
                      form.values.exception?.repeatedEvery?.filter(
                        element => element !== Weekdays[day as keyof typeof Weekdays],
                      ),
                    )
                  }
                }}
              />
            ))}
          </Box>
        )
        : null}
    </>
  )
}

export default StatusRepeatedPeriod
