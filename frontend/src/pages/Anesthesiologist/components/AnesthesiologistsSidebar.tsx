import { AnestChipSources, Capabilities, DnDItemTypes, drawerWidth, IUser } from '@smambu/lib.constants'
import { Box, TextField, Typography } from '@mui/material'
import { SectionTitle, Space10, Space20 } from 'components/Commons'
import { useRemoveAnesthesiologistFromCase, useRemoveAnesthesiologistFromRoom } from 'hooks'
import { useGetAnesthesiologists } from 'hooks/userHooks'
import React from 'react'
import { useDrop } from 'react-dnd'
import { useAppSelector } from 'store'
import { trlb } from 'utilities'
import AnesthesiologistChip from './AnesthesiologistChip'

const AnesthesiologistsSidebar = ({
  openSidebar,
  draggingAnesthesiologistId,
  setDraggingAnesthesiologistId,
  date,
  timeStamp,
}: {
  openSidebar: boolean
  draggingAnesthesiologistId: string
  setDraggingAnesthesiologistId: (value: string) => void
  date: Date
  timeStamp: number
}) => {
  useGetAnesthesiologists()
  const users = useAppSelector(state => state.users)

  const allUsers: IUser[] = Object.values(users)
  const anesthesiologistsIds = allUsers
    .filter((user: IUser) => user?.roles
      ?.some(r => r.capabilities.includes(Capabilities.U_IS_ANESTHESIOLOGIST)))
    .map(u => u._id)

  const [search, setSearch] = React.useState('')
  const removeAnesthesiologistFromCase = useRemoveAnesthesiologistFromCase()
  const removeAnesthesiologistFromRoom = useRemoveAnesthesiologistFromRoom()

  const filteredAnests = React.useMemo(() => {
    const anests = anesthesiologistsIds
      .map(id => {
        return users[id]
      })
      .sort((a, b) => ((b?.firstName || '') > (a?.firstName || '') ? -1 : 1))
    return anests
      .filter(anest => (anest?.firstName + ' ' + anest?.lastName).toLowerCase().includes(search.toLowerCase()))
      .map(a => a?.id)
  }, [search, anesthesiologistsIds, users])

  // eslint-disable-next-line max-len
  const [{ isOver }, dropRef] = useDrop<{ source: AnestChipSources; sourceId: string; id: string, timeStamp?: number }, void, { isOver: boolean }>(
    () => ({
      accept: DnDItemTypes.ANESTHESIOLOGIST,
      collect: monitor => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
      canDrop: item => {
        return item.source !== AnestChipSources.SIDEBAR
      },
      drop (item) {
        if (item.source === AnestChipSources.OR)
          removeAnesthesiologistFromRoom({
            date,
            anesthesiologistId: item.id,
            orScheduleId: item.sourceId,
          })
        else
          removeAnesthesiologistFromCase({
            caseId: item.sourceId,
            anesthesiologistId: item.id,
            timeStamp,
          })
      },
    }),
    [removeAnesthesiologistFromCase],
  )

  if (!openSidebar) return null

  return (
    <Box
      sx={{
        backgroundColor: theme => theme.palette.primary.light,
        minHeight: 'calc(100vh - 64px)',
        position: 'fixed',
        top: 64,
        right: 0,
        width: drawerWidth,
        zIndex: 1000,
      }}
    >
      <Box
        ref={dropRef}
        sx={{
          backgroundColor: theme => (isOver
            ? theme.palette.secondary.light
            : theme.palette.primary.light),
          p: 2,
          pt: 10,
        }}
      >
        <SectionTitle text={trlb('anestSchedule_sidebarTitle')} />
        <Space10 />
        <Typography variant='body2'>{trlb('anestSchedule_sidebarExplanation')}</Typography>
        <Space10 />
        <TextField value={search} onChange={e => setSearch(e.target.value)} label={trlb('anestSchedule_searchAnest')} />
        <Space10 />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {filteredAnests.map(id => (
            <AnesthesiologistChip
              key={id}
              {...{
                id,
                sx: { flexGrow: 1, width: '100%', m: 0 },
                source: AnestChipSources.SIDEBAR,
                draggingAnesthesiologistId,
                setDraggingAnesthesiologistId,
              }}
            />
          ))}
        </Box>
        <Space20 />
      </Box>
    </Box>
  )
}

export default AnesthesiologistsSidebar
