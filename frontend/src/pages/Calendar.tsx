import React, { ReactNode } from 'react'
import {
  Typography,
  Box,
  IconButton,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined'
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined'
import { PageContainer, FlexContainer } from 'components/Commons'
import { trlb } from 'utilities'
import {
  add,
  format,
  getMinutes,
  sub,
} from 'date-fns'
import { routes } from 'routes/routes'
import {
  calendarTimeHeightPx,
  DnDItemTypes,
  calendardHoursWidth,
  permissionRequests,
  getSurgeryName,
  ILimitedCase,
  getTimeStepProps,
  eScheduleNoteTimeSteps,
} from '@smambu/lib.constants'
import { useNavigate } from 'react-router-dom'
import { CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox, InfoOutlined, Today } from '@mui/icons-material'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useAppSelector } from 'store'
import Calendar from 'components/pages/Calendar/Calendar/Calendar'
import { OrtabItem, useCalendarNavigation, useGetcasesThatCanIview } from 'hooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useSelectedDate } from 'hooks/globalHooks'

const CalendarPage = () => {
  const fullScreen = useAppSelector(state => state.global.fullScreen)
  const { date, setDate } = useSelectedDate()
  const getcasesThatCanIview = useGetcasesThatCanIview()
  const cases = getcasesThatCanIview()
  const { view, setView } = useCalendarNavigation(routes.calendar)

  return (
    <PageContainer sx={{ width: '100%', maxHeight: fullScreen ? '100vh' : 'calc(100vh - 64px)', padding: '16px' }}>
      <Calendar
        route={routes.calendar}
        cases={cases}
        edit={false}
        view={view}
        setView={setView}
        date={date}
        setDate={setDate}
        path={routes.calendar}
        headerTitle={trlb('calendar_title')}
        fullScreen={fullScreen}
      />
    </PageContainer>
  )
}

export const ORTabs = ({
  orIds,
  setOrIds,
  tabsList,
}: {
  orIds: string[]
  setOrIds: (input: string[]) => void
  tabsList: OrtabItem[]
}) => {
  const handleChange = (event: SelectChangeEvent<typeof orIds>) => {
    const value = event.target.value
    setOrIds(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    )
  }

  const allChecked = orIds.length === tabsList.length
  const getAllIcon = () => {
    if (allChecked) return <CheckBox />
    else if (orIds.length > 0) return <IndeterminateCheckBox />
    else return <CheckBoxOutlineBlank />
  }

  const onAllClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation()
    e.preventDefault()
    if (allChecked) setOrIds([])
    else if (orIds.length > 0) setOrIds([])
    else return setOrIds(tabsList.map(tab => tab.operatingRoomId))
  }

  return (
    <FlexContainer>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel>{trlb('calendar_view_rooms')}</InputLabel>
        <Select
          multiple
          value={orIds}
          onChange={handleChange}
          input={<OutlinedInput label={trlb('calendar_view_rooms')} />}
          renderValue={selected =>
            tabsList
              .filter(tab => selected.includes(tab.operatingRoomId))
              .map(tab => tab.name)
              .join(', ')
          }
        >
          <MenuItem value='all'>
            <Checkbox icon={getAllIcon()} onClick={onAllClick} />
            <ListItemText primary={trlb('calendar_or_all')} />
          </MenuItem>
          {tabsList.map(or => (
            <MenuItem key={or.operatingRoomId} value={or.operatingRoomId}>
              <Checkbox checked={orIds.includes(or.operatingRoomId)} />
              <ListItemText primary={trlb(or.name)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FlexContainer>
  )
}

interface IHourSlotProps {
  slot: Date
}

export const HourSlot = ({ slot }: IHourSlotProps) => {
  const visible = getMinutes(slot) % 30 === 0
  return (
    <Box
      sx={{
        width: calendardHoursWidth,
        height: calendarTimeHeightPx,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        borderTop: '1px solid',
        borderColor: theme => (visible ? theme.palette.customColors.mainSlots : 'transparent'),
      }}
    >
      {visible
        ? (
          <Typography variant='caption' sx={{ pt: 0 }}>
            {format(slot, 'HH:mm')}
          </Typography>
        )
        : null}
    </Box>
  )
}

interface ICaseInfoButtonProps {
  c: ILimitedCase
}

export const CaseInfoButton = ({ c }: ICaseInfoButtonProps) => {
  const navigate = useNavigate()
  return (
    <IconButton size='small' onClick={() => navigate(routes.caseDetails.replace(':caseId', c.caseId))}>
      <InfoOutlined />
    </IconButton>
  )
}

interface ICaseBulletProps {
  c: ILimitedCase
  edit: boolean
  setDraggingCaseId: (value: string) => void
  children: ReactNode | ReactNode[]
}

export const CaseBullet = ({ c, children, edit, setDraggingCaseId }: ICaseBulletProps) => {
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
  const [{ opacity }, dragRef, dragPreview] = useDrag(
    () => ({
      type: DnDItemTypes.CASE,
      item: () => {
        setDraggingCaseId(c.caseId)
        return c
      },
      collect: monitor => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
        isDragging: monitor.isDragging(),
      }),
      canDrag: edit,
      end: () => {
        setDraggingCaseId('')
      },
    }),
    [edit],
  )

  React.useEffect(() => {
    dragPreview(getEmptyImage())
  }, [])

  const navigate = useNavigate()
  const contracts = useAppSelector(state => state.contracts)
  const surgeryName = getSurgeryName({
    caseForm: c,
    contracts,
  })

  return canViewCaseBookingInfo && canViewBooking
    ? (
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
          opacity,
        }}
        onClick={canViewCase ? () => navigate(routes.caseDetails.replace(':caseId', c.caseId)) : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              height: theme => theme.spacing(2),
              width: theme => theme.spacing(2),
              backgroundColor: theme => theme.palette.customColors[c.status],
              borderRadius: theme => theme.constants.radius,
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='caption' sx={{ fontWeight: 600 }}>
              {surgeryName}
            </Typography>
            <Typography variant='caption'>{format(c.bookingSection.date, 'dd/MM/yyyy HH:mm')}</Typography>
          </Box>
        </Box>
        {children}
      </Box>
    )
    : null
}

interface INavMenuProps {
  date: Date
  setDate: (value: Date) => void
  timeStep: string
}

export const NavMenu = ({ date, setDate, timeStep }: INavMenuProps) => {
  const { today, timeString, isToday } =
    getTimeStepProps(date, timeStep as eScheduleNoteTimeSteps)

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 300,
      }}
    >
      <IconButton onClick={() => setDate(sub(date, { [timeStep]: 1 }))} sx={{ bgcolor: 'primary.light' }}>
        <NavigateBeforeOutlinedIcon />
      </IconButton>
      <IconButton disabled={isToday} onClick={() => setDate(today)} sx={{ bgcolor: 'primary.light' }}>
        <Today />
      </IconButton>
      <Typography
        variant='h6'
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme => theme.palette.primary.main,
        }}
      >
        {timeString}
      </Typography>
      <IconButton onClick={() => setDate(add(date, { [timeStep]: 1 }))} sx={{ bgcolor: 'primary.light' }}>
        <NavigateNextOutlinedIcon />
      </IconButton>
    </Box>
  )
}

export default CalendarPage
