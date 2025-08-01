import { CaseStatus, getLockedWeekTimestamp, ILimitedCase, permissionRequests } from '@smambu/lib.constants'
import React, { useEffect, useMemo, useState } from 'react'
import { format, isSameWeek, startOfMonth, startOfWeek } from 'date-fns'
import { useConfirmCases, useGetCalendarCases, useLockCases, useLockWeek, useRecoverBookingsFromBackup } from 'hooks'
import { FlexContainer, PageHeader, Panel } from 'components/Commons'
import { Box, Button, Typography, Theme, Fab, SnackbarOrigin, Snackbar, IconButton } from '@mui/material'
import { trlb } from 'utilities'
import { NavMenu } from 'pages/Calendar'
import { useDispatch } from 'react-redux'
import ConfirmScheduleChangeModal from 'components/pages/Calendar/ConfirmScheduleChangeModal'
import { SCHEDULING_ACTION } from 'store/actions'
import { useAppSelector } from 'store'
import { useGetCheckPermission } from 'hooks/userPermission'
import {
  TimeSteps,
  useCalendarCasesPolling,
  useGetPendingCases,
  useOrTabs,
  useSchedulingData,
  View,
} from 'hooks/calendar/calendarHooks'
import PendingBoxNotEmptyAlert from './PendingBoxNotEmptyAlert'
import { DayTab } from './DayTab'
import { WeekTab } from './WeekTab'
import { MonthTab } from './MonthTab'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'
import FullScreen from './FullScreen'
import { ExpandCircleDown } from '@mui/icons-material'
import OrSelector from './OrSelector'
import { drawerWidth } from '@smambu/lib.constants/src/constants'
import { useGetOrScheduling } from 'hooks/roomsHooks'
import { useGetAnesthesiologists } from 'hooks/userHooks'

const timeZone = import.meta.env.VITE_TIME_ZONE

type tElements = {
  key: string;
  status: CaseStatus | undefined;
  label?: string;
}[]

const elements = [
  { key: 'pendingOption', status: CaseStatus.PENDING },
  { key: 'lockedOption', status: CaseStatus.LOCKED },
  { key: 'holdOption', status: CaseStatus.ON_HOLD },
  { key: 'changeRequestedOption', status: CaseStatus.CHANGE_REQUESTED },
  { key: 'changeNotifiedOption', status: CaseStatus.CHANGE_NOTIFIED },
  { key: 'confirmedOption', status: CaseStatus.CONFIRMED },
  { key: 'preOpOption', status: CaseStatus.IN_PRE_OP, label: 'colorsLegend_preOp' },
  { key: 'inOrOption', status: CaseStatus.IN_OR, label: 'colorsLegend_intraOp' },
  { key: 'postOpOption', status: CaseStatus.IN_POST_OP, label: 'colorsLegend_postOp' },
  { key: 'allOthersOption', status: undefined, label: 'colorsLegend_checkOut' },
] as tElements

const ColorLegend = ({ openSidebar }: { openSidebar?: boolean }) => {
  interface State extends SnackbarOrigin {
    open: boolean
  }

  const [state, setState] = React.useState<State>({
    open: false,
    vertical: 'bottom',
    horizontal: 'right',
  })
  const { vertical, horizontal, open } = state

  const openLegend = (newState: SnackbarOrigin) => () => {
    setState({ ...newState, open: true })
  }

  const closeLegend = () => {
    setState({ ...state, open: false })
  }

  return (
    <>
      <Fab
        color='primary'
        sx={{
          position: 'fixed',
          right: openSidebar ? drawerWidth : 0,
          transition: theme => theme.transitions.create('right', { easing: theme.transitions.easing.easeOut, duration: theme.transitions.duration.enteringScreen }),
          bottom: 0,
          m: 1,
        }}
        onClick={openLegend({ vertical: 'bottom', horizontal: 'right' })}
      >
        <QuestionMarkIcon color='secondary' sx={{ fill: 'white' }} />
      </Fab>

      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        onClose={closeLegend}
        message={
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='subtitle1'>
                {trlb('colorsLegend_title')}
              </Typography>
            </Box>
            {elements.map(element => (
              <FlexContainer key={element.status}>
                <Box
                  sx={{
                    width: '15px',
                    height: '15px',
                    borderRadius: theme => theme.constants.radius,
                    backgroundColor: theme =>
                      element.status == null
                        ? theme.palette.customColors.defaultCaseColor
                        : theme.palette.customColors[element.status!],
                    marginLeft: '20px',
                    border: '2px solid',
                    borderColor: theme => theme.palette.customColors[`${status}_border`],
                  }}
                />
                <Typography variant='subtitle1'>
                  {trlb(element.label ?? element.status!)}
                </Typography>
              </FlexContainer>
            ))}
          </Box>
        }
      />
    </>
  )
}

interface ICalendarProps {
  schedulingEnabled?: boolean
  route: string
  draggingCaseId?: string
  setDraggingCaseId?: (value: string) => void
  cases: ILimitedCase[]
  edit?: boolean
  view: View
  setView: (value: View) => void
  date: Date
  setDate: (value: Date) => void
  path: string
  headerTitle: string
  headerChildren?: React.ReactNode
  fullScreen?: boolean
  toggleSidebar?: () => void
  openSidebar?: boolean
}

const Calendar = ({
  schedulingEnabled = false,
  draggingCaseId,
  setDraggingCaseId,
  cases,
  edit,
  view,
  setView,
  date,
  setDate,
  path,
  headerTitle,
  headerChildren,
  fullScreen,
  toggleSidebar,
  openSidebar,
}: ICalendarProps) => {
  useGetAnesthesiologists()

  const { orTabList, orIds, setOrIds } = useOrTabs({ cases })
  const getOrScheduling = useGetOrScheduling()

  const lockedWeekTimestamp = getLockedWeekTimestamp(date, timeZone)
  useSchedulingData(date)
  const { getCalendarCases } = useGetCalendarCases()
  useCalendarCasesPolling(view, date)

  useEffect(() => {
    if (view === 'day')
      getOrScheduling(date)
    getCalendarCases(tabs[view]?.timeStep, date)
  }, [date, view])

  const dispatch = useDispatch()
  const lockCases = useLockCases()
  const confirmCases = useConfirmCases()
  const recoverBookingsFromBackup = useRecoverBookingsFromBackup()
  const pendingCases = useGetPendingCases(date)
  const lockWeek = useLockWeek()
  const checkPermission = useGetCheckPermission()

  const [saving, setSaving] = useState(false)
  const [pendingBoxNotEmpty, setPendingBoxNotEmpty] = useState(false)
  const [expandedBefore, setExpandedBefore] = useState(false)
  const [expandedAfter, setExpandedAfter] = useState(false)
  const [weeksTimestampsInEditMode, setWeeksTimestampsInEditMode] = useState<number[]>([])

  const { lockedWeeks, caseBackup } = useAppSelector(state => state.scheduling)
  const lastSave = useMemo(
    () =>
      schedulingEnabled && lockedWeeks?.[lockedWeekTimestamp]
        ? new Date(lockedWeeks?.[lockedWeekTimestamp] * 1000)
        : null,
    [lockedWeeks, schedulingEnabled, lockedWeekTimestamp],
  )
  const isWeekLocked = Boolean(lastSave)
  const canViewAllCalendar = checkPermission(permissionRequests.canViewAllCalendar)
  const canViewDailyCalendar = checkPermission(permissionRequests.canViewDailyCalendar)
  const canViewWeeklyCalendar = checkPermission(permissionRequests.canViewWeeklyCalendar)
  const canViewMonthlyCalendar = checkPermission(permissionRequests.canViewMonthlyCalendar)
  const canSchedule = checkPermission(permissionRequests.canSchedule)
  const canScheduleRooms = checkPermission(permissionRequests.canScheduleRooms)
  const canScheduleDayBookings = checkPermission(permissionRequests.canScheduleDayBookings)

  const limitedView = canScheduleRooms || canScheduleDayBookings

  const canAccessScheduling = checkPermission(permissionRequests.canAccessScheduling)

  const canEdit = useMemo(() => (view === 'day' || view === 'week') && schedulingEnabled, [view, schedulingEnabled])

  const canDrop = canEdit && canAccessScheduling

  const handleSave = () => {
    if (pendingCases.length > 0) setPendingBoxNotEmpty(true)
    else setSaving(true)
  }

  const toggleEditMode = async () => {
    if ((edit &&
      weeksTimestampsInEditMode.includes(lockedWeekTimestamp)) ||
      isWeekLocked)
      return true

    await lockWeek(date)
    await lockCases(
      cases
        .filter(c => isSameWeek(c.bookingSection.date, date, { weekStartsOn: 1 }) &&
        c.status === CaseStatus.PENDING)
        .map(c => c.caseId),
    )

    setWeeksTimestampsInEditMode(prevState => [...prevState, lockedWeekTimestamp])
  }

  // i know that these names are long, but i'm sacrificing brevity for clarity
  // in a very complex use case
  const canSeeWeekTabInCalendar = canViewWeeklyCalendar || canViewAllCalendar
  const canSeeMonthTabInCalendar = canViewMonthlyCalendar || canViewAllCalendar

  const showDayTab = canViewDailyCalendar || canViewAllCalendar
  const showWeekTab = schedulingEnabled
    ? !limitedView && canSeeWeekTabInCalendar
    : canSeeWeekTabInCalendar
  const showMonthTab = schedulingEnabled
    ? !limitedView && canSeeMonthTabInCalendar
    : canSeeMonthTabInCalendar

  const tabs: {
    [key: string]: any
  } = {
    ...(showDayTab && {
      day: {
        key: 'day',
        timeStep: TimeSteps.days,
      },
    }),
    ...(showWeekTab && {
      week: {
        key: 'week',
        timeStep: TimeSteps.weeks,
      },
    }),
    ...(showMonthTab && {
      month: {
        key: 'month',
        timeStep: TimeSteps.months,
      },
    }),
  }

  const getTabComponent = (view: View) => {
    switch (view) {
      case View.day:
        return <DayTab
          edit={edit || canDrop}
          date={date}
          orIds={orIds}
          setDraggingCaseId={setDraggingCaseId}
          draggingCaseId={draggingCaseId}
          cases={cases}
          expandedBefore={expandedBefore}
          expandedAfter={expandedAfter}
          setExpandedBefore={setExpandedBefore}
          setExpandedAfter={setExpandedAfter}
          toggleEditMode={toggleEditMode}
          schedulingEnabled={schedulingEnabled}
          openSidebar={openSidebar}
          lockedWeekCaseBackup={caseBackup[lockedWeekTimestamp]}
        />
      case View.week:
        return <WeekTab
          edit={edit || canDrop}
          date={startOfWeek(date, { weekStartsOn: 1 })}
          orIds={orIds}
          setDraggingCaseId={setDraggingCaseId}
          draggingCaseId={draggingCaseId}
          cases={cases}
          expandedBefore={expandedBefore}
          expandedAfter={expandedAfter}
          toggleEditMode={toggleEditMode}
          setExpandedAfter={setExpandedAfter}
          setExpandedBefore={setExpandedBefore}
          openSidebar={openSidebar}
          schedulingEnabled={schedulingEnabled}
          lockedWeekCaseBackup={caseBackup[lockedWeekTimestamp]}
        />
      case View.month:
        return (
          <MonthTab edit={false}
            date={startOfMonth(date)}
            orIds={orIds}
            setDate={setDate}
            cases={cases}
            path={path} />
        )
    }
  }

  const save = async (
    casesWithForcedChange: {
      caseId: string
      note: string
    }[],
  ) => {
    await confirmCases(
      cases
        .filter(
          c =>
            isSameWeek(c.bookingSection.date, date, { weekStartsOn: 1 }) &&
            (c.status === CaseStatus.LOCKED || c.status === CaseStatus.PENDING),
        )
        .map(c => ({
          caseId: c.caseId,
          note: '',
        }))
        .concat(casesWithForcedChange),
    )
    await lockWeek(date)
    dispatch({
      type: SCHEDULING_ACTION.RESET_BACKUPS,
      payload: {
        lockedWeekTimestamp,
      },
    })
    setSaving(false)
    setWeeksTimestampsInEditMode(prevState => prevState
      .filter(timestamp => timestamp !== lockedWeekTimestamp))
  }

  const onTabChange = (newValue: View) => {
    setView(newValue)
  }

  const getSaveButton = () =>
    canEdit &&
    canSchedule && (
      <Button variant='contained' color='secondary' onClick={handleSave}>
        {trlb('commons_confirm')}
      </Button>
    )

  const lockedWeekCaseBackup = caseBackup[lockedWeekTimestamp]
  const caseBackupExists = lockedWeekCaseBackup != null
    ? Object.values(lockedWeekCaseBackup).length > 0
    : false

  const changesNotConfirmed = isWeekLocked && caseBackupExists
  const showSideBar = toggleSidebar != null && !limitedView

  return (
    <>
      <Box sx={{ position: 'sticky', top: fullScreen ? 0 : 64, zIndex: 1000, bgcolor: 'background.paper' }}>
        <PageHeader
          pageTitle={headerTitle}
          backButtonSx={{ display: 'none' }}
          toolbarSx={{ justifyContent: 'space-between', py: 0 }}
          pageTitleSx={{ alignItems: 'flex-start' }}
          titleTypographySx={{ width: 'fit-content' }}
        >
          {tabs?.[view] && (
            <NavMenu
              date={date}
              setDate={setDate}
              timeStep={tabs[view]?.timeStep}
            />
          )}
          <CalendarViewMode tabs={tabs} view={view} onTabChange={onTabChange} />
          {headerChildren}
          {fullScreen != null ? <FullScreen /> : null}
          {showSideBar && (
            <IconButton onClick={toggleSidebar} sx={{ transform: `rotate(${openSidebar ? 270 : 90}deg)` }}>
              <ExpandCircleDown />
            </IconButton>
          )}
        </PageHeader>
        {!limitedView && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            {!isWeekLocked
              ? (
                <Box sx={{ width: 100 }} />
              )
              : (
                <Panel
                  sx={{
                    py: 1,
                    px: 3,
                    backgroundColor: (theme: Theme) =>
                      changesNotConfirmed
                        ? theme.palette.secondary.light
                        : theme.palette.primary.light,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant='subtitle2'>
                    {trlb(changesNotConfirmed ? 'calendar_editMessage' : 'calendar_lastConfirmation', {
                      date: format(lastSave!, 'dd-MM-yyyy HH:mm'),
                    })}
                  </Typography>
                </Panel>
              )}
            {getSaveButton()}
            {canEdit && canSchedule && isWeekLocked && caseBackupExists && (
              <Button
                sx={{ whiteSpace: 'nowrap', ml: 2 }}
                variant='text'
                color='primary'
                onClick={() => recoverBookingsFromBackup(lockedWeekTimestamp, date)}
              >
                {trlb('commons_discardChanges')}
              </Button>
            )}
          </Box>
        )}
        <OrSelector orIds={orIds} setOrIds={setOrIds} orTabList={orTabList} />
      </Box>
      <Box
        sx={{
          width: '100%',
          overflow: 'scroll',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          height: '90%',
        }}
      >
        {getTabComponent(view)}
      </Box>
      {tabs?.[view] && <ColorLegend openSidebar={openSidebar} />}
      <ConfirmScheduleChangeModal {...{ saving, setSaving, save, date, setDate, cases }} />
      <PendingBoxNotEmptyAlert open={pendingBoxNotEmpty}
        onClose={() => setPendingBoxNotEmpty(false)} />
    </>
  )
}
export default Calendar

const CalendarViewMode = ({
  tabs,
  view,
  onTabChange,
}: {
  tabs: {
    [key: string]: any
  }
  view: View
  onTabChange: (value: any) => void
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', gap: 0.5 }}>
      {Object.values(tabs).map(tab => (
        <Button
          key={tab.key}
          variant={tab.key === view ? 'contained' : 'text'}
          sx={{ px: 1, py: 0.5, minWidth: '1px' }}
          onClick={() => onTabChange(tab.key)}
        >
          {trlb('calendar_view_' + tab.key)}
        </Button>
      ))}
    </Box>
  )
}
