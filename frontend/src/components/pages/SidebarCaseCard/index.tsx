import { CaseStatus, ILimitedCase } from '@smambu/lib.constants'
import { CaseBullet } from 'components/pages/Calendar/CaseBullet'
import { CaseInfoButton } from 'pages/Calendar'
import React, { MouseEvent } from 'react'
import { useRestoreBoookingRequest } from 'hooks'
import { IconButton } from '@mui/material'
import { Restore } from '@mui/icons-material'
import CloseCaseButton from 'pages/CaseDetails/components/CloseCaseButton'

const RestoreRequestButton = ({ c }: { c: ILimitedCase }) => {
  const restoreBookingRequest = useRestoreBoookingRequest()

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    await restoreBookingRequest(c.caseId)
  }

  return (
    <IconButton size='small' onClick={handleClick}>
      <Restore />
    </IconButton>
  )
}

interface SidebarCaseCardProps {
  c: ILimitedCase
  edit: boolean
  setDraggingCaseId: (value: string) => void
  additionalText?: string
  caseRefreshFunction?: () => void
}

const SidebarCaseCard = ({
  c,
  edit,
  setDraggingCaseId,
  additionalText,
  caseRefreshFunction
}: SidebarCaseCardProps) => {
  return (
    <CaseBullet {...{ c, edit, setDraggingCaseId, additionalText }}>
      {c.status === CaseStatus.ON_HOLD
        ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <CaseInfoButton {...{ c }} />
            <RestoreRequestButton {...{ c }} />
            <CloseCaseButton caseItem={c} caseRefreshFunction={caseRefreshFunction!} compact />
          </div>
        )
        : (
          <CaseInfoButton {...{ c }} />
        )}
    </CaseBullet>
  )
}

export default SidebarCaseCard
