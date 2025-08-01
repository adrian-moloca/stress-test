import React from 'react'
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { trlb } from 'utilities/translator/translator'
import { useAppSelector } from 'store'
import { OperatingRoom } from '@smambu/lib.constants'
import { FormikProps } from 'formik'
import { useNavigate } from 'react-router'
import { routes } from 'routes/routes'
import { defaultStyles } from 'ThemeProvider'
import { TOrInitialValues } from 'pages/OrManagementPage'

const RoomSelection = ({ form }: { form: FormikProps<TOrInitialValues> }) => {
  const operatingRooms = useAppSelector(state => state.operatingRooms)
  const navigate = useNavigate()

  return (
    <FormControl>
      <InputLabel>{trlb('orManagement_selectRoom_label')}</InputLabel>
      <Select
        sx={{ maxHeight: '60px', width: '700px' }}
        label={trlb('orManagement_selectRoom_label')}
        defaultValue={form.values.operatingRoomId}
        value={form.values.operatingRoomId}
        onChange={event => {
          navigate(routes.mapOrDetails(event.target.value))
        }}
        MenuProps={defaultStyles.MenuProps}
      >
        {Object.values(operatingRooms).map((room: OperatingRoom) => {
          return (
            <MenuItem value={room.operatingRoomId}
              key={room.operatingRoomId}
              sx={defaultStyles.MenuItemSx}>
              {room.name}
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )
}

export default RoomSelection
