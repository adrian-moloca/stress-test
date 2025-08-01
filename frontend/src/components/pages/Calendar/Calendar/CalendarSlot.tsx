import {
  calendarSpaceBetweenColumns,
  calendarTimeHeightPx,
  CaseStatus,
  checkCanDropCase,
  Contract,
  DnDItemTypes,
  ILimitedCaseForCard,
  isPendingCase,
  permissionRequests,
} from '@smambu/lib.constants'
import React from 'react'
import { add, differenceInSeconds, format, isAfter, isBefore, isSameMinute } from 'date-fns'
import { useRescheduleCase } from 'hooks'
import { Box, Typography } from '@mui/material'
import { useDrop } from 'react-dnd'
import { useGetContractsByDoctorId, useIsDateInsideDoctorContracts } from 'hooks/contractHooks'
import { OutOfContractModal } from '../WeekRoomsTableCell'
import { useGetCheckPermission } from 'hooks/userPermission'
import { CaseCard } from './CaseCard'

interface ICalendarSlotProps {
  edit: boolean
  cases: ILimitedCaseForCard[]
  slot: Date
  isRoomAvailable: boolean
  setDraggingCaseId?: (value: string) => void
  operatingRoomId: string
  toggleEditMode?: () => void
  schedulingEnabled?: boolean
  columnWidth?: number
  index?: number
  isFirstOr?: boolean
  isLastOr?: boolean
}

export const CalendarSlot = ({
  edit,
  cases,
  slot,
  isRoomAvailable,
  setDraggingCaseId,
  operatingRoomId,
  toggleEditMode,
  schedulingEnabled,
  columnWidth,
  index,
  isFirstOr,
  isLastOr,
}: ICalendarSlotProps) => {
  const [secondsFromTop, setSecondsFromTop] = React.useState<null | number>(null)

  const checkPermission = useGetCheckPermission()
  const canSchedule = checkPermission(permissionRequests.canSchedule)
  const canScheduleDayBookings = checkPermission(permissionRequests.canScheduleDayBookings)
  const canScheduleRooms = checkPermission(permissionRequests.canScheduleRooms)

  const maxSlotDate = add(slot, { minutes: 5, seconds: -1 })
  const minSlotDate = add(slot, { seconds: -1 })

  React.useEffect(() => {
    const calcSecondsFromTop = () => {
      const newNow = new Date()
      const isNow = isBefore(minSlotDate, newNow) && isBefore(newNow, maxSlotDate)
      if (isNow)
        setSecondsFromTop(differenceInSeconds(newNow, minSlotDate))
      else
        setSecondsFromTop(null)
    }

    const interval = setInterval(() => {
      calcSecondsFromTop()
    }, 1000 * 60)

    calcSecondsFromTop()
    return () => clearInterval(interval)
  }, [minSlotDate, maxSlotDate])

  const slotCases = cases.filter(
    c =>
      isBefore(new Date(c.bookingSection.date), maxSlotDate) &&
    isAfter(new Date(c.bookingSection.date), minSlotDate),
  )
  const rescheduleCase = useRescheduleCase()

  const getContractsByDoctorId = useGetContractsByDoctorId()
  const isDateInsideDoctorContracts = useIsDateInsideDoctorContracts()

  const [errorDropOutsideContract, setErrorDropOutsideContract] = React.useState(false)
  const [isInsideContract, setIsInsideContract] = React.useState(false)
  const [itemContractDates, setItemContractDates] = React.useState<{ validFrom: Date;
    validUntil: Date }[]>([])

  const [{ isOver }, dropRef] = useDrop<ILimitedCaseForCard, Promise<void>, { isOver: boolean }>(
    () => ({
      accept: DnDItemTypes.CASE,
      collect: monitor => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
      hover: item => {
        setIsInsideContract(isDateInsideDoctorContracts({ date: slot, caseItem: item }))
      },
      drop: async item => {
        if (item === null || item === undefined) return

        const bookingSection = item.bookingSection
        if (bookingSection === null || bookingSection === undefined) return

        const previousDate = item.bookingSection.date
        const isSameDate = isSameMinute(slot, previousDate)
        const isSameRoom = item.operatingRoomId === operatingRoomId
        const isPending = isPendingCase(item)
        const isSideBarCard = isPending ||
          item.status === CaseStatus.CHANGE_REQUESTED ||
          item.status === CaseStatus.ON_HOLD

        if (isSameDate && isSameRoom && !isSideBarCard) return

        if (toggleEditMode) await toggleEditMode()
        if (isInsideContract) {
          rescheduleCase({
            caseId: item.caseId,
            newDate: slot,
            newOrId: operatingRoomId,
            withoutBackup: canScheduleRooms || canScheduleDayBookings,
          })
        } else {
          const doctorContracts = getContractsByDoctorId(item.bookingSection.doctorId)

          const contractDates = doctorContracts
            .filter(contract =>
              Object.values(contract.opStandards!)
                .some(ops => ops.opStandardId === item.bookingSection.opStandardId))
            .map((contract: Contract) => ({
              validFrom: contract.details.validFrom,
              validUntil: contract.details.validUntil,
            }))

          setErrorDropOutsideContract(true)

          setItemContractDates(contractDates.map(contract => ({
            validFrom: new Date(contract.validFrom),
            validUntil: new Date(contract.validUntil),
          })))
        }
      },
      canDrop: caseItem => {
        if (!isRoomAvailable) return false

        return checkCanDropCase(
          caseItem,
          { canSchedule, canScheduleDayBookings, canScheduleRooms },
          slot,
          operatingRoomId
        )
      },
    }),
    [slot, operatingRoomId, isInsideContract, itemContractDates],
  )

  return (
    <Box
      ref={dropRef}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {secondsFromTop != null
        ? (
          <Box
            sx={{
              position: 'absolute',
              top: `${(secondsFromTop * 100) / 300}%`,
              left: isFirstOr ? 0 : -calendarSpaceBetweenColumns,
              right: isLastOr ? 0 : -calendarSpaceBetweenColumns,
              zIndex: 1000,
              height: '1px',
              backgroundColor: theme => theme.palette.error.main,
            }}
          />
        )
        : null}
      <Box
        sx={{
          height: calendarTimeHeightPx,
          flexGrow: 1,
          borderTop: '1px solid',
          borderColor: theme =>
            !index || index % 6 === 0
              ? theme.palette.customColors.mainSlots
              : theme.palette.customColors.secondarySlots,
          position: 'relative',
        }}
      >
        {slotCases.map(c => (
          <CaseCard
            key={c.caseId}
            c={c}
            edit={edit}
            setDraggingCaseId={setDraggingCaseId}
            schedulingEnabled={schedulingEnabled}
            columnWidth={columnWidth}
          />
        ))}
      </Box>
      {isOver
        ? (
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              left: 0,
              right: 0,
              zIndex: 2000,
            }}
          >
            <Typography variant='h6' sx={{ color: theme => theme.palette.secondary.main }}>
              {format(slot, 'HH:mm')}
            </Typography>
          </Box>
        )
        : null}
      <OutOfContractModal
        {...{
          errorDropOutsideContract,
          setErrorDropOutsideContract,
          itemContractDates,
        }}
      />
    </Box>
  )
}
