import { AnestChipSources, DnDItemTypes, getFullName, permissionRequests } from '@smambu/lib.constants'
import { Chip } from '@mui/material'
import { useDrag } from 'react-dnd'
import React from 'react'
import { useAppSelector } from 'store'
import { useGetCheckPermission } from 'hooks/userPermission'

const AnesthesiologistChip = ({
  id,
  sx,
  source,
  sourceId,
  draggingAnesthesiologistId,
  setDraggingAnesthesiologistId,
}: {
  id: string
  sx?: any
  source: AnestChipSources
  sourceId?: string
  draggingAnesthesiologistId?: string
  setDraggingAnesthesiologistId?: (id: string) => void
}) => {
  const checkPerrmissions = useGetCheckPermission()
  const canEditAnesthesiologistsScheduling = checkPerrmissions(permissionRequests
    .canEditAnesthesiologistsScheduling)
  const users = useAppSelector(state => state.users)
  const anest = users[id]

  const [{ opacity, isDragging }, dragRef] = useDrag(
    () => ({
      type: DnDItemTypes.ANESTHESIOLOGIST,
      item: { ...anest, source, sourceId },
      collect: monitor => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => {
        return canEditAnesthesiologistsScheduling
      },
    }),
    [source, anest, canEditAnesthesiologistsScheduling],
  )

  React.useEffect(() => {
    if (!setDraggingAnesthesiologistId) return
    if (isDragging) setDraggingAnesthesiologistId(id)
    else if (draggingAnesthesiologistId === id) setDraggingAnesthesiologistId('')
  }, [isDragging])

  return (
    <Chip
      ref={dragRef}
      key={id}
      label={getFullName(anest, true)}
      sx={{
        ml: 1,
        backgroundColor: theme => theme.palette.secondary.light,
        opacity,
        zIndex: 5,
        mb: '2px',
        ...sx,
      }}
    />
  )
}

export default AnesthesiologistChip
