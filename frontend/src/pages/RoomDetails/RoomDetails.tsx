import React, { useState } from 'react'
import { Panel, SectionSubtitle, SectionTitle, Space20 } from 'components/Commons'
import { TextField, Box, Typography } from '@mui/material'
import { TextIconButton } from 'components/Buttons'
import { trlb } from 'utilities/translator/translator'
import DeleteIcon from '@mui/icons-material/Delete'
import RoomName from './components/RoomName'
import RoomStatus from './components/RoomStatus'
import StatusRepeatedPeriod from './components/StatusRepeatedPeriod'
import { FormikProps } from 'formik'
import StandardDialog from 'components/StandardDialog'
import { useDeleteRoom, useGetOperatingRooms } from 'hooks/roomsHooks'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from 'store'
import { routes } from 'routes/routes'
import { TOrInitialValues } from 'pages/OrManagementPage'
import { ILimitedCase } from '@smambu/lib.constants'

const RoomDetails = ({
  form,
  showDays,
  setShowDays,
  canEditOr,
  addNewRoomPage,
  canDeleteOr,
}: {
  form: FormikProps<TOrInitialValues>
  showDays: boolean
  setShowDays: (value: boolean) => void
  canEditOr: boolean
  addNewRoomPage: boolean
  canDeleteOr: boolean
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const deleteRoom = useDeleteRoom()
  const getOperatingRooms = useGetOperatingRooms()
  const limitedCases = useAppSelector(state => state.limitedCases)
  const [roomId, setRoomId] = useState('')
  const navigate = useNavigate()

  const countOpRoomsInCases = (cases: Record<string, ILimitedCase>) => {
    let contOpId = 0
    Object.values(cases).map(el => {
      if (el.operatingRoomId === form.values.operatingRoomId) contOpId = contOpId + 1
      return contOpId
    })
    return contOpId
  }

  const opRoomsIncases = countOpRoomsInCases(limitedCases)
  const children =
    opRoomsIncases === 0
      ? (
        <TextField
          onChange={e => setRoomId(e.target.value)}
          error={roomId !== form.values.operatingRoomId && roomId.length > 0}
          helperText={roomId !== form.values.operatingRoomId && roomId.length > 0 ? trlb('wrong_room_id') : ''}
        ></TextField>
      )
      : null
  return (
    <>
      <Space20 />
      <Panel sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <StandardDialog
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          titleKey={'delete_room'}
          textKey={opRoomsIncases > 0 ? 'room_cannotDelete_error' : 'room_delete_confirm'}
          textVars={{
            id: form.values.operatingRoomId ?? '',
            casesCount: String(opRoomsIncases),
          }}
          onConfirm={async () => {
            await deleteRoom({ roomId: form.values.operatingRoomId })
            await getOperatingRooms()
            setShowDeleteModal(false)
            navigate(routes.orList)
          }}
          confirmDisabled={opRoomsIncases > 0 || roomId !== form.values.operatingRoomId}
        >
          {children}
        </StandardDialog>
        <SectionTitle text={trlb('room_details')} />
        <RoomName
          addNewRoomPage={addNewRoomPage}
          form={form}
          canEditOr={canEditOr}
        />
        {canDeleteOr && !addNewRoomPage
          ? (
            <TextIconButton
              text={trlb('delete_or')}
              icon={<DeleteIcon sx={{ marginRight: '10px', fill: 'red' }} />}
              onClick={() => setShowDeleteModal(true)}
            />
          )
          : null}
      </Panel>
      <Space20 />
      <Panel sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <RoomStatus form={form} canEditOr={canEditOr} />
        <StatusRepeatedPeriod
          showDays={showDays}
          setShowDays={setShowDays}
          form={form}
          canEditOr={canEditOr}
        />
      </Panel>
      <Space20 />
      <Panel sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <SectionSubtitle text={trlb('formBooking_Notes')} />
        <Box sx={{ justifyContent: 'center', width: '100%' }}>
          <TextField
            sx={{ width: '100%' }}
            label={trlb('formBooking_Notes')}
            variant='outlined'
            rows={4}
            multiline
            value={form.values.notes}
            disabled={!canEditOr}
            onChange={e => form.setFieldValue('notes', e.target.value)}
          />
        </Box>
      </Panel>
      {Object.values(form.errors).length > 0 && (
        <Typography sx={{ marginTop: '20px', color: 'red' }} variant='body2'>
          {trlb('orManagement_mandatoryFields_empty')}
        </Typography>
      )}
    </>
  )
}

export default RoomDetails
