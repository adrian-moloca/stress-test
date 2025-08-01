import { getHours, getMinutes, isBefore, isSameDay, setHours, setMinutes } from 'date-fns'
import React from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Theme,
} from '@mui/material'
import { useIsOperatingRoomAvailable, useRescheduleCase } from 'hooks'
import {
  CaseStatus,
  checkCanDropCase,
  Contract,
  dayMaxWidth,
  DnDItemTypes,
  ILimitedCase,
  isPendingCase,
  permissionRequests,
} from '@smambu/lib.constants'
import { useDrop } from 'react-dnd'
import { CaseBullet } from 'components/pages/Calendar/CaseBullet'
import { trlb } from 'utilities'
import { useGetContractsByDoctorId, useIsDateInsideDoctorContracts } from 'hooks/contractHooks'
import { useGetCheckPermission } from 'hooks/userPermission'

interface WeekRoomsTableCellProps {
  day: number
  date: Date
  edit: boolean
  or: any
  setDraggingCaseId?: (id: string) => void
  cases: ILimitedCase[]
  toggleEditMode?: () => void
}

const WeekRoomsTableCell = ({
  day,
  date,
  edit,
  or,
  setDraggingCaseId,
  cases,
  toggleEditMode,
}: WeekRoomsTableCellProps) => {
  const checkPermission = useGetCheckPermission()
  const canSchedule = checkPermission(permissionRequests.canSchedule)
  const canScheduleDayBookings = checkPermission(permissionRequests.canScheduleDayBookings)
  const canScheduleRooms = checkPermission(permissionRequests.canScheduleRooms)

  const rescheduleCase = useRescheduleCase()

  const isOperatingRoomAvailable = useIsOperatingRoomAvailable()
  const isRoomAvailable = isOperatingRoomAvailable({
    operatingRoomId: or.operatingRoomId,
    date,
  })
  const filteredCases = Object.values(cases)
    .filter(
      c => isSameDay(c.bookingSection.date, date) &&
      (!or.operatingRoomId ||
        c.operatingRoomId === or.operatingRoomId),
    )
    .sort((a, b) => (isBefore(a.bookingSection.date, b.bookingSection.date) ? -1 : 1))

  const getContractsByDoctorId = useGetContractsByDoctorId()
  const isDateInsideDoctorContracts = useIsDateInsideDoctorContracts()
  const [errorDropOutsideContract, setErrorDropOutsideContract] = React.useState(false)

  const [isInsideContract, setIsInsideContract] = React.useState(false)
  const [itemContractDates, setItemContractDates] = React.useState<{ validFrom: Date;
    validUntil: Date }[]>([])

  const [{ isOver }, dropRef] = useDrop<ILimitedCase, unknown, { isOver: boolean }>(
    () => ({
      accept: DnDItemTypes.CASE,
      collect: monitor => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
      hover: item => {
        const isInside = isDateInsideDoctorContracts({ date, caseItem: item })
        setIsInsideContract(isInside)
      },
      drop: async item => {
        const previousDate = item.bookingSection.date
        const isSameDate = isSameDay(date, previousDate)
        const isSameRoom = item.operatingRoomId === or.id
        const isPending = isPendingCase(item)
        const isSideBarCard = isPending ||
        item.status === CaseStatus.CHANGE_REQUESTED ||
        item.status === CaseStatus.ON_HOLD

        if (isSameDate && isSameRoom && !isSideBarCard) return
        if (toggleEditMode) await toggleEditMode()
        if (isInsideContract) {
          const caseHours = getHours(item.bookingSection.date)
          const caseMinutes = getMinutes(item.bookingSection.date)
          const newDate = setMinutes(setHours(new Date(date), caseHours), caseMinutes)
          rescheduleCase({
            caseId: item.caseId,
            newDate,
            newOrId: or.operatingRoomId,
          })
        } else {
          setErrorDropOutsideContract(true)
          setItemContractDates(
            getContractsByDoctorId(item.bookingSection?.doctorId)
              .filter(contract =>
                Object.values(contract.opStandards ?? {}).some(
                  contr => contr.opStandardId === item.bookingSection.opStandardId,
                ))
              .map((contract: Contract) => ({
                validFrom: contract.details.validFrom as Date,
                validUntil: contract.details.validUntil as Date,
              })),
          )
        }
      },
      canDrop: caseItem => {
        if (!isRoomAvailable) return false

        return checkCanDropCase(
          caseItem,
          { canSchedule, canScheduleDayBookings, canScheduleRooms },
          date,
          or.operatingRoomId
        )
      },
    }),
    [cases, date, or.operatingRoomId, isRoomAvailable, isInsideContract],
  )

  const getBgColor = (theme: Theme) => {
    if (isRoomAvailable && isOver && isInsideContract)
      return theme.palette.customColors.hoveredTimeSlot
    else if (isRoomAvailable) return theme.palette.customColors.availableTimeSlot
    else return theme.palette.customColors.unavailableTimeSlot
  }
  return (
    <>
      <Box
        ref={dropRef}
        key={day}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: dayMaxWidth,
          gap: 1,
          width: 'calc(100% / 8)',
          alignSelf: 'stretch',
          bgcolor: getBgColor,
          borderRadius: theme => theme.constants.radius,
          m: 0.5,
          p: 0.5,
        }}
      >
        {filteredCases.map(c => (
          <CaseBullet key={c.caseId} {...{ c, edit, setDraggingCaseId }} />
        ))}
      </Box>
      <OutOfContractModal
        {...{
          errorDropOutsideContract,
          setErrorDropOutsideContract,
          itemContractDates,
        }}
      />
    </>
  )
}

export const OutOfContractModal = ({
  errorDropOutsideContract,
  setErrorDropOutsideContract,
  itemContractDates,
}: {
  errorDropOutsideContract: boolean
  setErrorDropOutsideContract: (value: boolean) => void
  itemContractDates: { validFrom: Date; validUntil: Date }[]
}) => {
  return (
    <Dialog
      open={Boolean(errorDropOutsideContract)}
      onClose={() => setErrorDropOutsideContract(false)}
      aria-labelledby='responsive-dialog-title'
    >
      <DialogTitle id='responsive-dialog-title'>{trlb('date_outside_contract')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`${trlb('available_contract_dates')}:`}
          <List>
            {itemContractDates.map((it, idx) => (
              <ListItem key={`listitem_${idx}`}>
                <ListItemText
                  primary={
                    <React.Fragment>
                      <>
                        <b>{`${it.validFrom}`}</b>
                        {trlb('date_outside_contract_spacer')}
                        <b>{`${it.validUntil}`}</b>
                      </>
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={() => setErrorDropOutsideContract(false)}>
          {trlb('commons_cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WeekRoomsTableCell
