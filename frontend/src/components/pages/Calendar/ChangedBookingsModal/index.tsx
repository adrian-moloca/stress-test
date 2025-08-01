import React from 'react'
import { Box, Drawer, Typography } from '@mui/material'
import { Case, CaseStatus, getCaseContract } from '@smambu/lib.constants'
import { PersonPinCircle } from '@mui/icons-material'
import { CaseInfoButton } from 'pages/Calendar'
import { trlb } from 'utilities'
import { format, isValid } from 'date-fns'
import { useAppSelector } from 'store'

interface IChangedBookingsModalProps {
  open: boolean
  onClose: () => void
  cases: Case[]
}

const ChangedBookingsModal = ({ open, onClose, cases }: IChangedBookingsModalProps) => {
  const changeNotifiedCases = cases.filter(c => c.status === CaseStatus.CHANGE_REQUESTED)
  const contracts = useAppSelector(state => state.contracts)

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1500,
        width: 400,
        flexShrink: 0,
      }}
    >
      <Box sx={{ width: 400, p: 2 }}>
        <Typography variant='h5' align='center' sx={{ p: 2 }}>
          Changed Requests
        </Typography>
        {changeNotifiedCases?.map(c => {
          const patientIsArrived = isValid(c.timestamps.patientArrivalTimestamp)
          const contract = getCaseContract({
            caseForm: c,
            contracts,
          })
          const opStandard = contract?.opStandards?.[c.bookingSection.opStandardId]

          return (
            <div key={c.caseId}>
              <Box
                sx={{
                  boxShadow: theme => theme.constants.boxShadow,
                  mx: 1,
                  borderRadius: theme => theme.constants.radius,
                  backgroundColor: theme =>
                    theme.palette.customColors[c.status] ??
                    theme.palette.customColors.defaultCaseColor,
                  mb: 4,
                  position: 'relative',
                }}
              >
                <Box sx={{ minHeight: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: -1, justifyContent: 'space-between', mr: -1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: patientIsArrived ? -1 : 0 }}>
                      {patientIsArrived ? <PersonPinCircle /> : null}
                      <Typography variant='body1'>{opStandard?.name}</Typography>
                    </Box>
                    <CaseInfoButton {...{ c }} />
                  </Box>
                  <Typography variant='caption'>
                    {trlb('calendarCard_status') + ': '}
                    <strong>{c.status}</strong>
                  </Typography>
                  <Typography variant='caption'>
                    {trlb('calendarCard_datetime') + ': '}
                    <strong>{format(c.bookingSection.date, 'HH:mm')}</strong>
                  </Typography>
                  <Typography variant='caption'>
                    {trlb('calendarCard_patient') + ': '}
                    <strong>{c.bookingPatient.name + ' ' + c.bookingPatient.surname}</strong>
                  </Typography>
                  <Typography variant='caption'>
                    {trlb('calendarCard_birthDate') + ': '}
                    <strong>{format(c.bookingPatient.birthDate, 'dd-MM-yyyy')}</strong>
                  </Typography>
                  <Typography variant='caption'>
                    {trlb('calendarCard_insuranceStatus') + ': '}
                    <strong>{'german insurance status'}</strong>
                  </Typography>
                  <Typography variant='caption'>
                    {trlb('calendarCard_gender') + ': '}
                    <strong>{c.bookingPatient.gender}</strong>
                  </Typography>
                  <Typography variant='caption'>
                    {trlb('calendarCard_medicalGender') + ': '}
                    <strong>{c.bookingPatient.genderBirth}</strong>
                  </Typography>
                </Box>
              </Box>
            </div>
          )
        })}
      </Box>
    </Drawer>
  )
}

export default ChangedBookingsModal
