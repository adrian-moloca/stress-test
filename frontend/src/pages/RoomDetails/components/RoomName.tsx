import React from 'react'
import { Box, TextField } from '@mui/material'
import { trlb } from 'utilities/translator/translator'

const RoomName = ({
  addNewRoomPage, form, canEditOr
}: {
  addNewRoomPage: boolean; form: any, canEditOr: boolean
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        marginBottom: '20px',
        marginRight: '10px',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '20px',
      }}
    >
      <TextField
        variant='outlined'
        value={form.values.name}
        disabled={!canEditOr}
        label={trlb('name')}
        sx={{ margin: '10px', fontSize: '18px' }}
        onChange={e => form.setFieldValue('name', e.target.value)}
        onBlur={form.handleBlur}
        name='name'
        error={form.touched.name ? form.errors.name : false}
        helperText={form.touched.name ? form.errors.name : ''}
        required
      />
      <TextField
        variant='outlined'
        disabled={!addNewRoomPage}
        sx={{ margin: '10px', fontSize: '18px' }}
        label={trlb('room_id_label')}
        value={form.values.customRoomId}
        onBlur={form.handleBlur}
        name='customRoomId'
        onChange={e => form.setFieldValue('customRoomId', e.target.value)}
        error={form.touched.customRoomId ? form.errors.customRoomId : false}
        helperText={form.touched.customRoomId ? form.errors.customRoomId : ''}
        required
      />
    </Box>
  )
}

export default RoomName
