import React, { ReactNode } from 'react'
import { Typography, Box } from '@mui/material'
import { format } from 'date-fns'
import { routes } from 'routes/routes'
import {
  DnDItemTypes,
  permissionRequests,
  getSurgeryName,
  ILimitedCase,
  reassegnableRoomStatuses,
  getFullName,
} from '@smambu/lib.constants'
import { useNavigate } from 'react-router-dom'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useAppSelector } from 'store'
import { useGetCheckPermission } from 'hooks/userPermission'

interface ICaseBulletProps {
  c: ILimitedCase
  edit: boolean
  setDraggingCaseId?: (value: string) => void
  children?: ReactNode | ReactNode[]
  additionalText?: string
}

export const CaseBullet = ({
  c,
  children,
  edit,
  setDraggingCaseId,
  additionalText
}: ICaseBulletProps) => {
  const user = useAppSelector(state => state.auth.user)
  const checkPermission = useGetCheckPermission()
  const canViewCase = checkPermission(permissionRequests.canViewCase, {
    caseItem: c,
    user,
  })
  const canViewCaseBookingInfo = checkPermission(permissionRequests.canViewCaseBookingInfo, {
    caseItem: {
      bookingSection: {
        doctorId: c.bookingSection.doctorId,
      },
    },
  })
  const canViewBooking = checkPermission(permissionRequests.canViewBooking, {
    caseItem: {
      bookingSection: {
        doctorId: c.bookingSection.doctorId,
      },
    },
  })
  const [, dragRef, dragPreview] = useDrag(
    () => ({
      type: DnDItemTypes.CASE,
      item: () => {
        setDraggingCaseId?.(c.caseId)
        return c
      },
      collect: monitor => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
        isDragging: monitor.isDragging(),
      }),
      canDrag: edit && reassegnableRoomStatuses.includes(c.status),
      end: () => {
        setDraggingCaseId?.('')
      },
    }),
    [c],
  )

  React.useEffect(() => {
    dragPreview(getEmptyImage())
  }, [])

  const navigate = useNavigate()
  const contracts = useAppSelector(state => state.contracts)
  const { caseBackup } = useAppSelector(state => state.scheduling)
  const surgeryName = getSurgeryName({
    caseForm: c,
    contracts,
  })
  const associatedDoctor = c.associatedDoctor
  const surgeonName = getFullName(associatedDoctor, true)

  const opacity = caseBackup[c.caseId] != null ? 0.5 : 1

  return (canViewCaseBookingInfo && canViewBooking) && (
    <Box
      ref={dragRef}
      sx={{
        backgroundColor: theme => theme.palette.background.paper,
        borderRadius: theme => theme.constants.radius,
        py: 0.5,
        px: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 1,
        cursor: 'pointer',
        opacity
      }}
      onClick={canViewCase ? () => navigate(routes.caseDetails.replace(':caseId', c.caseId)) : undefined}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            height: theme => theme.spacing(2),
            width: theme => theme.spacing(2),
            backgroundColor: theme =>
              theme.palette.customColors[c.status] ?? theme.palette.customColors.defaultCaseColor,
            borderRadius: theme => theme.constants.radius,
            flexShrink: 0,
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', wordBreak: 'break-all' }}>
          <Typography variant='caption' sx={{ fontWeight: 600 }}>
            {surgeryName}
          </Typography>
          <Typography variant='caption' sx={{ fontWeight: 600 }}>
            {surgeonName}
          </Typography>
          <Typography variant='caption'>{format(c.bookingSection.date, 'dd/MM/yyyy HH:mm')}</Typography>
          {additionalText ? <Typography variant='caption'>{additionalText}</Typography> : null}
        </Box>
      </Box>
      {children}
    </Box>
  )
}
