import { useAppSelector } from 'store'
import { useGetCalendarCases, usePutRequestOnHold } from 'hooks'
import { CaseStatus, DnDItemTypes, ILimitedCase, fullRescheduleCaseStatuses, permissionRequests } from '@smambu/lib.constants'
import { useDrop } from 'react-dnd'
import { Box } from '@mui/material'
import React from 'react'
import SidebarCaseCard from 'components/pages/SidebarCaseCard'
import { trlb } from 'utilities'
import { differenceInHours } from 'date-fns'
import { useGetCheckPermission } from 'hooks/userPermission'
import RequestsAccordion from './RequestsAccordion'

interface OnHoldBoxProps {
  edit: boolean
  setDraggingCaseId: (value: string) => void
  open: boolean
  setOpen: () => void
  date: Date
  timestep: string
}

const OnHoldBox = ({ setDraggingCaseId, edit, date, timestep, open, setOpen }: OnHoldBoxProps) => {
  const checkPermission = useGetCheckPermission()
  const canHoldBooking = checkPermission(permissionRequests.canHoldBooking)
  const limitedCases = useAppSelector(state => state.limitedCases)
  const putRequestOnHold = usePutRequestOnHold()
  const onHoldCases = Object.values(limitedCases).filter(c => c.status === CaseStatus.ON_HOLD)
  const count = onHoldCases?.length

  const { getCalendarCases } = useGetCalendarCases()

  const refreshCases = () => getCalendarCases(timestep, date)
  const [{ isOver }, dropRef] = useDrop<ILimitedCase, Promise<void>, { isOver: boolean }>(
    () => ({
      accept: DnDItemTypes.CASE,
      collect: monitor => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
      canDrop (item) {
        return fullRescheduleCaseStatuses.includes(item.status) &&
          item.status !== CaseStatus.ON_HOLD &&
          edit &&
          canHoldBooking
      },
      async drop (item) {
        await putRequestOnHold(item.caseId)
      },
    }),
    [edit, putRequestOnHold],
  )

  return (
    <RequestsAccordion
      title={trlb('orScheduling_requestOnHold', { count: count ? ` (${count})` : '' })}
      open={open}
      setOpen={setOpen}
      details={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', gap: 1 }}>
          {onHoldCases.map(c => {
            const onHoldDuration = differenceInHours(new Date(), c?.lastStatusEdit ?? new Date())

            let onHoldDurationText
            if (!c.lastStatusEdit) onHoldDurationText = ''
            else
              switch (onHoldDuration) {
                case 0:
                  onHoldDurationText = trlb('scheduling_onHoldDuration_lessThanAnHour')
                  break
                case 1:
                  trlb('scheduling_onHoldDuration_hours', { hours: String(onHoldDuration) })
                  break
                default:
                  trlb('scheduling_onHoldDuration_days', { days: String(Math.floor(onHoldDuration / 24)) })
                  break
              }

            return (
              <SidebarCaseCard
                key={c.caseId}
                {...{
                  c,
                  edit,
                  setDraggingCaseId,
                  additionalText: onHoldDurationText,
                  caseRefreshFunction: refreshCases
                }}
              />
            )
          })}
        </Box>
      }
      isOver={isOver}
      dropRef={dropRef}
    />
  )
}

export default OnHoldBox
