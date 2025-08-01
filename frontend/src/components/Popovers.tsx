import React, { ChangeEvent, Dispatch, SetStateAction, useState } from 'react'
import { Grid, Typography, Paper, Modal, TextField, FormControlLabel, Checkbox } from '@mui/material'
import { CloseButton, DeleteButton, SaveButton, TextIconButton } from './Buttons'
import { GridTextField, PageHeader, SectionSubtitle, SectionTitle, Space20 } from './Commons'
import DoneIcon from '@mui/icons-material/Done'
import { trlb } from '../utilities/translator/translator'
import { useNavigate } from 'react-router'
import { IUser, getFullName } from '@smambu/lib.constants'

export const ChangeRequested = () => {
  const navigate = useNavigate()
  // faccio vedere il popover con location.pathname, ovviamente poi sarà un'altra logica e il click del CloseButton non potrà essere history.push
  return (
    <Modal
      open={location.pathname === '/schedule/changerequested'}
      BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0, 0.3)' } }}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper style={{ minHeight: '45%', width: '50%', padding: '20px' }}>
        <Grid container sx={{ justifyContent: 'center' }}>
          <PageHeader pageTitle={trlb('booking_changeRequested')}>
            <CloseButton onClick={() => navigate('/schedule')} />
          </PageHeader>
          <SectionTitle text={trlb('booking_changeRequested_msg')} />
          <SectionSubtitle text={trlb('booking_changeRequested_doctorMsg')} />
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <TextField sx={{ width: '100%' }} label={trlb('formBooking_Notes')} variant='outlined' multiline rows={4} />
          </Grid>
          <Space20 />
          <TextIconButton text={trlb('booking_sendRequest')} icon={<DoneIcon sx={{ marginRight: '10px' }} />} />
        </Grid>
      </Paper>
    </Modal>
  )
}

export const ChangeNotified = () => {
  const navigate = useNavigate()

  // faccio vedere il popover con location.pathname, ovviamente poi sarà un'altra logica e il click del CloseButton non potrà essere history.push
  return (
    <Modal
      open={location.pathname === '/schedule/changenotified'}
      BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0, 0.3)' } }}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper style={{ minHeight: '45%', width: '50%', padding: '20px' }}>
        <Grid container sx={{ justifyContent: 'center' }}>
          <PageHeader
            pageTitle={trlb('changeNotified_title')}
            button={<CloseButton onClick={() => navigate('/schedule')} />}
          />
          <SectionTitle text={trlb('changeNotified_rescheduledAppointment')} />
          <Typography variant='h6' sx={{ width: '100%', textAlign: 'center' }}>
            {trlb('commons_from')}: 25/07/22 13:00{trlb('commons_divider')}15:00{' '}
          </Typography>

          <Typography variant='h6'>
            {trlb('commons_to')}: 26/07/22 13:00{trlb('commons_divider')}15:00{' '}
          </Typography>

          <Space20 />
          <FormControlLabel
            control={<Checkbox />}
            label={trlb('booking_noDoctor_confirmation')}
            sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          />
          <Space20 />
          <TextIconButton text={trlb('commons_send_notification')} icon={<DoneIcon sx={{ marginRight: '10px' }} />} />
        </Grid>
      </Paper>
    </Modal>
  )
}

interface ConfirmDeleteContractProps {
  showConfirm: boolean
  setShowConfirm: Dispatch<SetStateAction<boolean>>
  onConfirm: () => void
  doctorInfo?: null | IUser
}

export const ConfirmDeleteContract: React.FC<ConfirmDeleteContractProps> = ({
  showConfirm,
  setShowConfirm,
  onConfirm,
  doctorInfo,
}) => {
  const [doctorName, setDoctorName] = useState<string>()
  const doctorInfoName = getFullName(doctorInfo, true)
  return (
    <Modal
      open={showConfirm}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClose={() => setShowConfirm(false)}
    >
      <Paper style={{ minHeight: '45%', width: 'auto', padding: '20px' }}>
        <Grid container sx={{ justifyContent: 'center' }}>
          <PageHeader
            pageTitle={trlb('Warning')}
            button={<CloseButton onClick={() => setShowConfirm(false)} />}
            xs={{ width: '100%' }}
          />
          <Space20 />
          <Typography>{trlb('contract_reenter_doctor_name_to_confirm', { doctorInfoName })}</Typography>
          <Space20 />
          <GridTextField
            value={doctorName}
            label={trlb('doctor')}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorName(e.target.value)}
            variant='outlined'
            xs={12}
          />
        </Grid>
        <Space20 />
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          <DeleteButton onClick={onConfirm} disabled={doctorName !== doctorInfoName} />
        </Grid>
      </Paper>
    </Modal>
  )
}

interface ConfirmCreateContractProps {
  showConfirm: boolean
  setShowConfirm: Dispatch<SetStateAction<boolean>>
  onConfirm: () => void
  doctorInfo: IUser
  distance: number
}

export const ConfirmCreateContract: React.FC<ConfirmCreateContractProps> = ({
  showConfirm,
  setShowConfirm,
  onConfirm,
  doctorInfo,
  distance,
}) => {
  const [doctorName, setDoctorName] = useState<string>()
  const doctorInfoName = getFullName(doctorInfo, true)

  return (
    <Modal
      open={showConfirm}
      BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0, 0.3)' } }}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper style={{ minHeight: '45%', width: 'auto', padding: '20px' }}>
        <Grid container sx={{ justifyContent: 'center' }}>
          <PageHeader
            pageTitle={trlb('Warning')}
            button={<CloseButton onClick={() => setShowConfirm(false)} />}
            xs={{ width: '100%' }}
          />
          <Space20 />
          <Typography style={{ textAlign: 'center' }}>
            {trlb('contract_leave_doctor_selected_date_contract', {
              fullName: doctorInfoName,
              distance: distance.toString(),
            })}
          </Typography>
          <Space20 />
          <Typography>{trlb('contract_reenter_doctor_name_to_confirm', { doctorInfoName })}</Typography>
          <Space20 />
          <GridTextField
            xs={12}
            value={doctorName}
            label={trlb('doctor')}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorName(e.target.value)}
          />
        </Grid>
        <Space20 />
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          <SaveButton onClick={onConfirm} disabled={doctorName !== doctorInfoName} />
        </Grid>
      </Paper>
    </Modal>
  )
}
