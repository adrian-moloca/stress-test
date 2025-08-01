import React, { useState } from 'react'
import { PageContainer } from 'components/Commons'
import { ChangeNotified, ChangeRequested } from 'components/Popovers'

import { routes } from 'routes/routes'
import { CaseStatus, drawerWidth, permissionRequests } from '@smambu/lib.constants'
import { Theme } from '@mui/material/styles'
import CustomDragLayer from 'components/CustomDragLayer'
import Calendar from 'components/pages/Calendar/Calendar/Calendar'

import { trlb } from 'utilities'
import { TimeSteps, View, useCalendarNavigation, useGetcasesThatCanIview } from 'hooks'
import { useImportDoctorstIntoState } from 'hooks/userHooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useSelectedDate } from 'hooks/globalHooks'
import CasesDrawer from './components/CasesDrawer'
import { useAppSelector } from 'store'

const SchedulingPage = () => {
  const fullScreen = useAppSelector(state => state.global.fullScreen)
  const getcasesThatCanIview = useGetcasesThatCanIview()
  const allCases = getcasesThatCanIview()
  const checkPermission = useGetCheckPermission()
  const canScheduleRooms = checkPermission(permissionRequests.canScheduleRooms)
  const canScheduleDayBookings = checkPermission(permissionRequests.canScheduleDayBookings)
  const canAccessScheduling = checkPermission(permissionRequests.canAccessScheduling)
  const limitedView = canScheduleRooms || canScheduleDayBookings

  const [openSidebar, setOpenSidebar] = useState(!fullScreen && !limitedView)

  const cases = allCases.filter(c => c.status !== CaseStatus.ON_HOLD &&
    c.status !== CaseStatus.CHANGE_REQUESTED)

  const preferredView = limitedView ? View.day : undefined
  const { view, setView } = useCalendarNavigation(routes.schedule, preferredView)
  const { date, setDate } = useSelectedDate()
  const [draggingCaseId, setDraggingCaseId] = useState<string>('')

  useImportDoctorstIntoState()

  const toggleSidebar = () => setOpenSidebar(!openSidebar)
  const transitionWidth = openSidebar ? `calc(100% - ${drawerWidth}px)` : '100%'

  let timeStep

  switch (view) {
    case View.day:
      timeStep = TimeSteps.days
      break

    case View.week:
      timeStep = TimeSteps.weeks
      break

    default:
      timeStep = TimeSteps.months
      break
  }

  return (
    <>
      <CustomDragLayer />
      <PageContainer
        sx={{
          p: 0,
          px: 1,
          maxHeight: fullScreen ? '100vh' : 'calc(100vh - 64px)',
          transition: (theme: Theme) => {
            const easing = openSidebar
              ? theme.transitions.easing.easeOut
              : theme.transitions.easing.sharp

            const duration = openSidebar
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen

            return theme.transitions.create('width', {
              easing,
              duration,
            })
          },
          width: transitionWidth,
        }}
      >
        <Calendar
          route={routes.schedule}
          schedulingEnabled={true}
          draggingCaseId={draggingCaseId}
          setDraggingCaseId={setDraggingCaseId}
          cases={cases}
          edit={canAccessScheduling}
          view={view}
          setView={setView}
          date={date}
          setDate={setDate}
          path={routes.schedule}
          headerTitle={trlb('OR_scheduling_title')}
          toggleSidebar={toggleSidebar}
          openSidebar={openSidebar}
          fullScreen={fullScreen}
        />
        <CasesDrawer
          date={date}
          open={openSidebar}
          setDraggingCaseId={setDraggingCaseId}
          timestep={timeStep}
        />
      </PageContainer>
      <ChangeRequested />
      <ChangeNotified />
    </>
  )
}
export default SchedulingPage
