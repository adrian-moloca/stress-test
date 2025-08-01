import React from 'react'
import { Box } from '@mui/material'
import ChangeRequestedBox from './ChangeRequestedBox'
import OnHoldBox from './OnHoldBox'
import PendingBox from './PendingBox'
import { drawerWidth, eScheduleNoteTimeSteps, permissionRequests } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import ScheduleNotes from './ScheduleNotes'

type Props = {
  setDraggingCaseId: (id: string) => void
  open: boolean
  date: Date
  timestep: string
}

const CasesDrawer = ({ setDraggingCaseId, open, date, timestep }: Props) => {
  const [changeRequestedExpanded, setChangeRequestedExpanded] = React.useState(true)
  const [onHoldExpanded, setOnHoldExpanded] = React.useState(true)
  const [pendingExpanded, setPendingExpanded] = React.useState(true)

  const checkPermission = useGetCheckPermission()

  const canSchedule = checkPermission(permissionRequests.canSchedule)
  const canScheduleRooms = checkPermission(permissionRequests.canScheduleRooms)
  const canScheduleDayBookings = checkPermission(permissionRequests.canScheduleDayBookings)
  const canViewScheduleNotes = checkPermission(permissionRequests.canViewScheduleNotes)
  const limitedView = canScheduleRooms || canScheduleDayBookings

  if (limitedView || !open) return null

  const toggleChangeRequested = () => setChangeRequestedExpanded(!changeRequestedExpanded)
  const toggleOnHold = () => setOnHoldExpanded(!onHoldExpanded)
  const togglePending = () => setPendingExpanded(!pendingExpanded)

  return (
    <Box
      sx={{
        backgroundColor: theme => theme.palette.primary.light,
        position: 'fixed',
        top: 64,
        right: 0,
        bottom: 10,
        width: drawerWidth,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChangeRequestedBox
        setDraggingCaseId={setDraggingCaseId}
        edit={canSchedule}
        open={changeRequestedExpanded}
        setOpen={toggleChangeRequested}
      />
      <OnHoldBox
        setDraggingCaseId={setDraggingCaseId}
        edit={canSchedule}
        date={date}
        timestep={timestep}
        open={onHoldExpanded}
        setOpen={toggleOnHold}
      />
      <PendingBox
        open={pendingExpanded}
        setOpen={togglePending}
        setDraggingCaseId={setDraggingCaseId}
        edit={canSchedule}
        date={date}
        isLast={!canViewScheduleNotes}
      />
      {canViewScheduleNotes
        ? (
          <ScheduleNotes
            date={date}
            timeStep={timestep as eScheduleNoteTimeSteps}
          />
        )
        : null}
    </Box>
  )
}

export default CasesDrawer
