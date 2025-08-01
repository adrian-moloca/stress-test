import {
  calcCardDuration,
  calcCardHeight,
  calendarCondensedThreshold,
  calendarEllipsisGap,
  calendarNotesTypes,
  CaseStatus,
  checkCanRescheduleCase,
  DnDItemTypes,
  getCaseContract,
  getFullName,
  getLockedWeekTimestamp,
  getSurgeryName,
  ILimitedCaseForCard,
  intraOPCaseStatuses,
  permissionRequests,
} from '@smambu/lib.constants'
import React, { useEffect, useMemo } from 'react'
import { format, isToday } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, IconButton, Typography, ClickAwayListener, Theme } from '@mui/material'
import { trlb } from 'utilities'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useAppSelector } from 'store'
import { useGetCheckPermission } from 'hooks/userPermission'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useApproveChangeNotified } from 'hooks/caseshooks'
import { CaseProgressBar } from './CaseProgressBar'
import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import { PersonPinCircleIcon } from 'components/Icons'
import CaseCardResizer from './CaseCardResizer'
import { InfoOutlined } from '@mui/icons-material'
import { routes } from 'routes/routes'
import CaseNotes from './CaseNotes'

const timeZone = import.meta.env.VITE_TIME_ZONE

const intraOPPhases = [
  {
    start: 'anesthesiaStartedTimestamp',
    end: 'surgeryStartTimestamp',
  },
  {
    start: 'surgeryStartTimestamp',
    end: 'surgeryEndTimestamp',
  },
  {
    start: 'surgeryEndTimestamp',
    end: 'anesthesiaFinishedTimestap',
  },
]

interface ICaseCardProps {
  c: ILimitedCaseForCard
  edit: boolean
  setDraggingCaseId?: (value: string) => void
  schedulingEnabled?: boolean
  columnWidth?: number
}

export const CaseCard = ({
  c,
  edit,
  setDraggingCaseId,
  schedulingEnabled,
  columnWidth
}: ICaseCardProps) => {
  const { fullScreen } = useAppSelector(state => state.global)
  const noScroll = !fullScreen && schedulingEnabled
  const navigate = useNavigate()
  const [showMore, setShowMore] = React.useState(false)
  const { view } = useParams()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const approveChangeNotified = useApproveChangeNotified()
  const lockedWeekTimestamp = getLockedWeekTimestamp(c.bookingSection.date, timeZone)
  const checkPermission = useGetCheckPermission()
  const canViewIntraOpPhases = checkPermission(permissionRequests.canViewIntraOpPhases)
  const canViewPatientStatus = checkPermission(permissionRequests.canViewPatientStatus)
  const canEditCasesBookingInfo = checkPermission(permissionRequests.canEditCasesBookingInfo)
  const canViewCaseCardStatus = checkPermission(permissionRequests.canViewCaseCardStatus)

  const canSchedule = checkPermission(permissionRequests.canSchedule)
  const canScheduleRooms = checkPermission(permissionRequests.canScheduleRooms)
  const canScheduleDayBookings = checkPermission(permissionRequests.canScheduleDayBookings)

  const canDrag = checkCanRescheduleCase(c, {
    canSchedule,
    canScheduleRooms,
    canScheduleDayBookings,
  })

  const contracts = useAppSelector(state => state.contracts)
  const user = useAppSelector(state => state.auth.user)
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
  const contract = useMemo(
    () =>
      getCaseContract({
        caseForm: c,
        contracts,
      }),
    [contracts, c],
  )
  const opStandard = useMemo(() => contract?.opStandards?.[c.bookingSection.opStandardId]
    , [contract, c])
  const duration = c.bookingSection.duration ?? opStandard?.surgeryDurationInMinutes
  const height = React.useMemo(() => calcCardHeight(duration), [duration])
  const { caseBackup } = useAppSelector(state => state.scheduling)

  const caseIsToday = isToday(new Date(c.bookingSection.date))
  const doctorName = getFullName(c.associatedDoctor, true)
  const limitedDoctorName = c.associatedDoctor?.title ? `${c.associatedDoctor.title} ${c.associatedDoctor.lastName}` : c.associatedDoctor?.lastName
  const patientIsArrived = c.timestamps.patientArrivalTimestamp != null
  const patient = c.bookingPatient

  // XXX So: this is a TEMPORARY fix, and a bad one. There is a big problem with
  // the whole "formatters and other deeds", so this a bad (but working) workaround
  // to get around the problem.
  // This comment will disapper when the underlying problem gets fixed
  const canViewPatient = patient.name != null && patient.name !== ''
  const isCondensed = !showMore && height < calendarCondensedThreshold
  const caseStatus = view === 'day' && canViewCaseCardStatus ? trlb(c.status) : null

  const canViewProgressBar = intraOPCaseStatuses.includes(c.status) && canViewIntraOpPhases
  const canConfirmCase =
    canEditCasesBookingInfo &&
    c?.status === CaseStatus.CHANGE_NOTIFIED &&
    !caseBackup?.[lockedWeekTimestamp]?.[c.caseId]

  const rightBarEnabled = canViewCase || canViewProgressBar || canConfirmCase

  const [{ opacity }, dragRef, dragPreview] = useDrag(
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
      canDrag: edit && canDrag,
      end: () => {
        setDraggingCaseId?.('')
      },
    }),
    [edit, c],
  )

  useEffect(() => {
    dragPreview(getEmptyImage())
  }, [])

  const createCaseRow = (input: (string | undefined)[]) => {
    return input.filter(x => x).join(' - ')
  }

  const getColor = (theme: Theme) => theme.palette.customColors[c.status] ??
  theme.palette.customColors.defaultCaseColor
  const getBorderColor = (theme: Theme) => theme.palette.customColors[`${c.status}_border`] ?? theme.palette.customColors.defaultCaseBorderColor
  const sxText = {
    whiteSpace: !isCondensed && schedulingEnabled ? 'wrap' : 'nowrap',
    overflow: schedulingEnabled ? 'hidden' : 'visible',
  }

  if (!canViewCaseBookingInfo || !canViewBooking || !opStandard) return null

  const genderDiffers = canViewPatient && patient.gender !== patient.genderBirth

  const getCaseRowContent = () => {
    if (!canViewPatient)
      return ''

    const caseRow = createCaseRow([
      patient.name && patient.surname && patient.name + ' ' + patient.surname,
      patient.birthDate && format(new Date(patient.birthDate), 'dd/MM/yyyy'),
    ])

    if (isCondensed)
      return `${caseRow}${caseStatus != null ? ' - ' + caseStatus : ''}`

    return (
      <>
        {trlb('calendarCard_patient') + ': '}
        <strong style={sxText}>
          {caseRow}
        </strong>
      </>
    )
  }

  return (
    <CaseCardResizer {...{ c, schedulingEnabled, height, showMore, columnWidth }}>
      <ClickAwayListener onClickAway={() => setShowMore(false)}>
        <Box
          ref={dragRef}
          key={c.caseId}
          onClick={() => setShowMore(!showMore)}
          sx={{
            maxHeight: showMore ? 'auto' : height,
            minHeight: height,
            height: 'auto',
            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 25px',
            borderRadius: theme => theme.constants.radius,
            border: theme => `1px solid ${getBorderColor(theme)}`,
            borderLeft: theme => schedulingEnabled && c.edited ? `3px solid ${getBorderColor(theme)}` : undefined,
            // TODO temporarily replaced by the next line, we'll need a better solution opacity: Math.min(opacity, caseBackup?.[lockedWeekTimestamp]?.[c.caseId] ? 0.5 : 1),
            opacity: Math.min(opacity, 1),
            width: '100%',
            maxWidth: '100%',
            backgroundColor: getColor,
            overflow: 'hidden',
            position: 'relative',
            pr: canViewProgressBar ? 0.5 : 0,
          }}
        >
          <Box
            sx={{
              width: '100%',
              minHeight: '100%',
              p: 0.5,
              pr: rightBarEnabled ? 0 : 0.5,
              display: 'flex',
              justifyContent: 'space-between',
              lineHeight: isCondensed ? '1.2' : '1.5',
            }}
          >
            <Box
              sx={{
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
                overflow: 'hidden',
              }}
              ref={containerRef}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    maxWidth: '100%',
                    width: '100%',
                  }}
                >
                  {caseIsToday && canViewPatientStatus && (
                    <PersonPinCircleIcon sx={{ fontSize: 18 }} variant={patientIsArrived ? 'primary' : 'disabled'} />
                  )}
                  <EllipsisText {...{
                    noScroll,
                    text: createCaseRow([getSurgeryName({ caseForm: c, contracts }), doctorName]),
                    limitedText: createCaseRow([getSurgeryName({ caseForm: c, contracts }),
                      limitedDoctorName]),
                    strong: true,
                    sxText
                  }} />
                </Box>
              </Box>
              <EllipsisText {...{
                noScroll,
                text: getCaseRowContent(),
                strong: false,
                sxText
              }} />
              {!isCondensed && (
                <>
                  {caseStatus != null
                    ? (
                      <Typography variant='caption'>
                        {trlb('calendarCard_status') + ': '}
                        <strong>{caseStatus}</strong>
                      </Typography>
                    )
                    : null}
                  <CaseNotes caseItem={c} type={calendarNotesTypes.calendarNotes} />
                  <CaseNotes caseItem={c} type={calendarNotesTypes.calendarPreOpNotes} />
                  <CaseNotes caseItem={c} type={calendarNotesTypes.calendarPostOpNotes} />
                  {canViewPatient && (<Typography variant='caption'>
                    {trlb('calendarCard_gender') + ': '}
                    <strong>{trlb(patient.gender)}</strong>
                  </Typography>
                  )}
                  {genderDiffers && canViewPatient && (
                    <Typography variant='caption'>
                      {' ' + trlb('calendarCard_medicalGender') + ': '}
                      <strong>{trlb(patient.genderBirth)}</strong>
                    </Typography>
                  )}
                  <Typography variant='caption'>
                    {trlb('calendarCard_datetime') + ': '}
                    <strong>{format(new Date(c.bookingSection.date), 'HH:mm')}</strong>
                  </Typography>
                  <Typography variant='caption'>
                    {trlb('calendarCard_duration') + ': '}
                    <strong>{trlb('calendarCard_duration_minutes', { duration: String(duration) })}</strong>
                  </Typography>
                </>
              )}
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%',
                position: 'relative',
                top: -5,
                right: -2,
              }}
            >
              {canViewCase
                ? (
                  <IconButton
                    size='small'
                    sx={{ p: 0.1 }}
                    onClick={() => navigate(routes.caseDetails.replace(':caseId', c.caseId))}
                  >
                    <InfoOutlined sx={{ fontSize: 20 }} />
                  </IconButton>
                )
                : (
                  <Box />
                )}
              {canConfirmCase
                ? (
                  <IconButton size='small' sx={{ p: 0.1 }} onClick={_ => approveChangeNotified(c.caseId)}>
                    <CheckCircleOutlineIcon sx={{ fill: 'green', fontSize: 20 }} />
                  </IconButton>
                )
                : (
                  <Box />
                )}
            </Box>
          </Box>
          {canViewProgressBar
            ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: -1,
                  right: 0,
                }}
              >
                <CaseProgressBar
                  phases={intraOPPhases
                    .map(phase => ({
                      start: c.timestamps[phase.start as keyof typeof c.timestamps],
                      end: c.timestamps[phase.end as keyof typeof c.timestamps],
                      labels: phase,
                    }))
                    .filter(phase => phase.start !== null)}
                  date={c.bookingSection.date}
                  duration={calcCardDuration(height)}
                  cardHeight={height}
                />
              </Box>
            )
            : null}
        </Box>
      </ClickAwayListener>
    </CaseCardResizer>
  )
}

const animation = (second?: boolean) => keyframes`
  0% {
    left: ${second ? '100%' : 0};
    transform: translateX(0%);
  }
  100% {
    left: ${second ? 0 : '100%'};
    transform: translateX(-100%);
  }
`

const RotatedBox = styled('div')(({ second, totalLen }: { second?: boolean; totalLen: number }) => ({
  width: '100%',
  animation: `${animation(second)} ${totalLen / 20}s linear infinite`,
  display: 'flex',
  whiteSpace: 'pre',
}))

const EllipsisText = ({
  text, strong, noScroll, sxText, limitedText
}: {
  text: string | React.ReactNode;
  limitedText?: string | React.ReactNode;
  noScroll?: boolean;
  strong: boolean;
  sxText: React.CSSProperties;
}) => {
  const [ellipsisLen, setEllipsisLen] = React.useState(0)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const ellipsisRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const isOverflow = ellipsisLen - containerWidth > 0
  const totalLen = containerWidth + ellipsisLen

  const getText = ({ content }: { content: string | React.ReactNode; }) => (
    <Typography variant='caption' sx={sxText}>
      {strong ? <strong>{content}</strong> : content}
    </Typography>
  )

  React.useEffect(() => {
    const handleResize = () => {
      if (!ellipsisRef?.current || !containerRef.current) return
      const newEllipsisLen = ellipsisRef.current?.clientWidth
      if (newEllipsisLen !== ellipsisLen) setEllipsisLen(newEllipsisLen)

      const newContainerWidth = containerRef.current?.clientWidth
      if (newContainerWidth !== containerWidth) setContainerWidth(newContainerWidth)
    }
    handleResize()
  })

  return (
    <Box
      style={{
        width: '100%',
        maxWidth: '100%',
        height: 'fit-content',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      ref={containerRef}
    >
      <Box ref={ellipsisRef} style={{ position: 'absolute', visibility: 'hidden' }}>
        {getText({ content: text })}
      </Box>
      {noScroll || !isOverflow
        ? (
          getText({ content: isOverflow && limitedText != null ? limitedText : text })
        )
        : (
          <Box sx={{ display: 'flex' }}>
            <RotatedBox totalLen={totalLen}>
              {getText({ content: text })}
              <span>{Array.from({ length: calendarEllipsisGap }).join(' ')}</span>
            </RotatedBox>
            <RotatedBox second totalLen={totalLen}>
              {getText({ content: text })}
              <span>{Array.from({ length: calendarEllipsisGap }).join(' ')}</span>
            </RotatedBox>
          </Box>
        )}
    </Box>
  )
}
