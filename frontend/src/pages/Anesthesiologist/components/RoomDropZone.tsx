import { AnestChipSources, DnDItemTypes } from '@smambu/lib.constants'
import { Box, ClickAwayListener, Typography } from '@mui/material'
import { useAssignAnesthesiologistToRoom } from 'hooks'
import React from 'react'
import { useDrop } from 'react-dnd'
import { useAppSelector } from 'store'
import AnesthesiologistsChipManager from './AnesthesiologistsChipManager'

const RoomDropZone = ({
  draggingAnesthesiologistId,
  operatingRoomId,
  date,
  timeStamp,
}: {
  draggingAnesthesiologistId: string
  operatingRoomId: string
  date: Date
  timeStamp: number
}) => {
  const [showMore, setShowMore] = React.useState(false)
  const orSchedule = useAppSelector(state => state.orScheduling
    .find(orScheduling => orScheduling.operatingRoomId === operatingRoomId &&
      orScheduling.timeStamp === timeStamp))
  const operatingRooms = useAppSelector(state => state.operatingRooms)
  const assignAnesthesiologistToRoom = useAssignAnesthesiologistToRoom()

  // eslint-disable-next-line max-len
  const [{ isOver }, dropRef] = useDrop<{ id: string, source: AnestChipSources }, void, { isOver: boolean }>(
    () => ({
      accept: DnDItemTypes.ANESTHESIOLOGIST,
      collect: monitor => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
      canDrop: item => item.source === AnestChipSources.SIDEBAR &&
      !orSchedule?.anestIds.includes(item.id),
      drop (item) {
        assignAnesthesiologistToRoom({
          anesthesiologistId: item.id,
          operatingRoomId,
          date,
          timeStamp,
        })
      },
    }),
    [assignAnesthesiologistToRoom, operatingRoomId, date],
  )

  const operatingRoom = operatingRooms[operatingRoomId]

  const getBackgroundColor = () => {
    if (isOver) return 'secondary.dark'
    else if (draggingAnesthesiologistId) return 'secondary.light'
    else return 'background.paper'
  }

  return (
    <Box
      ref={dropRef}
      sx={{
        bgcolor: getBackgroundColor(),
        borderRadius: theme => theme.constants.radius,
        height: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
    >
      <Typography variant='h6' sx={{ maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {operatingRoom?.name}
      </Typography>
      <ClickAwayListener onClickAway={() => setShowMore(false)}>
        <Box sx={{ position: 'absolute', top: 40, right: 0 }} onClick={() => setShowMore(!showMore)}>
          {orSchedule != null && (
            <AnesthesiologistsChipManager
              sourceId={orSchedule._id}
              anestsIds={orSchedule.anestIds}
              showMore={showMore}
              source={AnestChipSources.OR}
            />
          )}
        </Box>
      </ClickAwayListener>
    </Box>
  )
}

export default RoomDropZone
