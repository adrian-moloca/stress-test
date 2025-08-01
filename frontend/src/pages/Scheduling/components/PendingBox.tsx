import React from 'react'
import { Box } from '@mui/material'
import SidebarCaseCard from 'components/pages/SidebarCaseCard'
import { useGetPendingCases } from 'hooks'
import RequestsAccordion from './RequestsAccordion'
import { trlb } from 'utilities'

interface PendingBoxProps {
  edit: boolean
  setDraggingCaseId: (value: string) => void
  date: Date
  open: boolean
  setOpen: () => void
  isLast: boolean
}

const PendingBox = ({ setDraggingCaseId, edit, date, open, setOpen, isLast }: PendingBoxProps) => {
  const pendingCases = useGetPendingCases(date)
  const count = pendingCases?.length

  return (
    <RequestsAccordion
      title={trlb('orScheduling_pendingRequests', { count: count ? ` (${count})` : '' })}
      open={open}
      setOpen={setOpen}
      details={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', gap: 1 }}>
          {pendingCases.map(c => (
            <SidebarCaseCard
              key={c.caseId}
              c={c}
              edit={edit}
              setDraggingCaseId={setDraggingCaseId}
            />
          ))}
        </Box>
      }
      isLast={isLast}
    />
  )
}

export default PendingBox
