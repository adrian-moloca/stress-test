import { useAppSelector } from 'store'
import { useRequestChangeToBooking } from 'hooks'
import { CaseStatus, DnDItemTypes, ILimitedCase, fullRescheduleCaseStatuses } from '@smambu/lib.constants'
import { useDrop } from 'react-dnd'
import { Box } from '@mui/material'
import React from 'react'
import SidebarCaseCard from 'components/pages/SidebarCaseCard'
import RequestsAccordion from './RequestsAccordion'
import { trlb } from 'utilities'

interface ChangeRequestedBoxProps {
  edit: boolean
  setDraggingCaseId: (value: string) => void
  open: boolean
  setOpen: () => void
}

const ChangeRequestedBox = ({
  setDraggingCaseId,
  edit,
  open,
  setOpen
}: ChangeRequestedBoxProps) => {
  const limitedCases = useAppSelector(state => state.limitedCases)
  const requestChangeToBooking = useRequestChangeToBooking()
  const changeRequestedCases = Object.values(limitedCases)
    .filter(c => c.status === CaseStatus.CHANGE_REQUESTED)
  const count = changeRequestedCases?.length

  const [{ isOver }, dropRef] = useDrop<ILimitedCase, Promise<void>, { isOver: boolean }>(
    () => ({
      accept: DnDItemTypes.CASE,
      collect: monitor => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
      canDrop (item) {
        return fullRescheduleCaseStatuses.includes(item.status) &&
          item.status !== CaseStatus.CHANGE_REQUESTED &&
          edit
      },
      async drop (item) {
        await requestChangeToBooking(item.caseId)
      },
    }),
    [edit, requestChangeToBooking],
  )

  return (
    <RequestsAccordion
      open={open}
      setOpen={setOpen}
      title={trlb('orScheduling_changeRequested', { count: count ? ` (${count})` : '' })}
      details={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', gap: 1 }}>
          {changeRequestedCases.map(c => (
            <SidebarCaseCard key={c.caseId} {...{ c, edit, setDraggingCaseId }} />
          ))}
        </Box>
      }
      isOver={isOver}
      dropRef={dropRef}
    />
  )
}

export default ChangeRequestedBox
