import { calcCardDuration, calendarTimeHeightPx, ILimitedCaseForCard, permissionRequests } from '@smambu/lib.constants'
import React from 'react'
import { addMinutes, format } from 'date-fns'
import { Box, Typography, useTheme } from '@mui/material'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useEditCaseDuration } from 'hooks/caseshooks'
import { Resizable } from 're-resizable'

interface ICaseCardProps {
  c: ILimitedCaseForCard
  schedulingEnabled?: boolean
  height: number
  showMore?: boolean
  children: React.ReactNode
  columnWidth?: number
}

export const CaseCardResizer = ({
  c,
  schedulingEnabled,
  height,
  showMore,
  children,
  columnWidth
}: ICaseCardProps) => {
  const checkPermission = useGetCheckPermission()
  const theme = useTheme()

  const canEditCaseDuration = checkPermission(permissionRequests.canEditCaseDuration,
    { caseItem: c })
  const editDurationEnabled = schedulingEnabled && canEditCaseDuration && !showMore
  const editCaseDuration = useEditCaseDuration()

  const [resizingHeight, setResizingHeight] = React.useState<number | null>(null)
  const newDuration = calcCardDuration(height + (resizingHeight ?? 0))

  const onResizeStop = () => {
    setResizingHeight(null)
    if (resizingHeight === 0) return
    const newDuration = calcCardDuration(height + (resizingHeight ?? 0))
    editCaseDuration(c.caseId, newDuration)
  }

  const offset = c.offset ?? 0
  const zIndex = c.zIndex ?? 0

  return (
    <Resizable
      size={{ width: columnWidth != null ? `${columnWidth}px` : '100%', height }}
      grid={[1, calendarTimeHeightPx]}
      style={{
        position: 'absolute',
        zIndex: showMore ? 1100 : zIndex,
        left: theme.spacing(offset * 2),
        right: showMore ? 'inherit' : theme.spacing(-offset * 2),
        top: offset * 4,
      }}
      onResize={(_e, _direction, _ref, d) => {
        if (height + d.height < calendarTimeHeightPx) return
        setResizingHeight(d.height)
      }}
      onResizeStart={() => setResizingHeight(0)}
      onResizeStop={onResizeStop}
      enable={
        !editDurationEnabled
          ? false
          : {
            top: false,
            right: false,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }
      }
    >
      {editDurationEnabled && resizingHeight == null
        ? (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              height: 15,
              width: 15,
              backgroundImage:
              'linear-gradient(135deg, transparent 70%, black 72%, transparent 74%, transparent 80%, black 81%, transparent 85%, transparent)',
            }}
          />
        )
        : null}
      {resizingHeight != null
        ? (
          <Box
            sx={{
              position: 'absolute',
              bottom: -32,
              left: 0,
              right: 0,
              zIndex: 1 + zIndex,
              borderTop: resizingHeight != null ? '1px solid' : 'none',
              borderColor: theme => theme.palette.customColors.calendarSelectedSlot,
            }}
          >
            <Typography variant='h6' sx={{ color: theme => theme.palette.secondary.main }}>
              {format(addMinutes(c.bookingSection.date, newDuration), 'HH:mm')}
            </Typography>
          </Box>
        )
        : null}
      {children}
    </Resizable>
  )
}

export default CaseCardResizer
