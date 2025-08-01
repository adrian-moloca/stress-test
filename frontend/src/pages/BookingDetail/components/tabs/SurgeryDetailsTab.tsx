import { CaseForm, getCaseContract } from '@smambu/lib.constants'
import { Box, Typography } from '@mui/material'
import { SectionTitle, Panel } from 'components/Commons'
import { FormikProps } from 'formik'
import { useAppSelector } from 'store'
import { trlb } from 'utilities'
import SurgeryInformationFields from './components/SurgeryInformationFields'
import React from 'react'

type SurgeryDetailsTabProps = {
  edit: boolean
  form: FormikProps<CaseForm>
  canViewSurgeryInfo: boolean
  canEditSurgeryInfo: boolean
}

export const SurgeryDetailsTab = ({
  edit,
  form,
  canViewSurgeryInfo,
  canEditSurgeryInfo,
}: SurgeryDetailsTabProps) => {
  const opStandardId = form.values.bookingSection.opStandardId
  const contracts = useAppSelector(state => state.contracts)
  const contract = getCaseContract({
    caseForm: form.values,
    contracts,
  })
  const opStandard = contract?.opStandards?.[opStandardId]
  const iHaveAllPreliminaryInfo =
    !form.errors?.bookingSection?.date &&
    !form.errors?.bookingSection?.doctorId &&
    !form.errors?.bookingSection?.opStandardId

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {canViewSurgeryInfo
        ? (
          <>
            <SectionTitle text={trlb('booking_surgery_tab_SurgerySpecifics')} />
            {iHaveAllPreliminaryInfo
              ? (
                <SurgeryInformationFields
                  readOnly={!edit || !canEditSurgeryInfo}
                  form={form}
                  opStandard={opStandard!}
                />
              )
              : (
                <Panel>
                  <Typography variant='h6' sx={{ textAlign: 'center' }}>
                    {trlb('missingBookingInfoWarning')}
                  </Typography>
                </Panel>
              )}
          </>
        )
        : null}
    </Box>
  )
}

export default SurgeryDetailsTab
