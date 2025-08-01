import { Case, CaseStatus, ILimitedCase, permissionRequests } from '@smambu/lib.constants'
import { Button, IconButton } from '@mui/material'
import StandardDialog from 'components/StandardDialog'
import { useCloseCase, useReOpenCase } from 'hooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import React, { MouseEvent, useEffect, useState } from 'react'
import { trlb } from 'utilities'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'

type Props = {
  caseItem: Case | ILimitedCase
  caseRefreshFunction: (caseId: string) => void
  compact?: boolean
}

const CloseCaseButton = ({ caseItem, caseRefreshFunction, compact }: Props) => {
  const [caseClosed, setCaseClosed] = useState(caseItem.closed)
  const [disabled, setDisabled] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)

  const checkPermission = useGetCheckPermission()

  const canCloseCases = checkPermission(permissionRequests.canCloseCases, { caseItem })
  const canReopenCases = checkPermission(permissionRequests.canReopenCases, { caseItem })

  const caseId = caseItem.caseId

  useEffect(() => {
    setCaseClosed(caseItem.closed)
  }, [caseItem.closed])

  const openPopup = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()

    setDisabled(true)
    setPopupOpen(true)
  }

  const closePopup = (e?: MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    setDisabled(false)
    setPopupOpen(false)
  }

  const onConfirm = async (e?: MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    if (caseClosed)
      await reOpenCase(caseId)
    else
      await closeCase(caseId)

    await caseRefreshFunction(caseId)
    closePopup()
  }

  const closeCase = useCloseCase()
  const reOpenCase = useReOpenCase()

  const labelKey = caseClosed ? 'reOpenCaseLabel' : 'closeCaseLabel'
  const titleKey = caseClosed ? 'reOpenCaseWarningTitle' : 'closeCaseWarningTitle'
  const textKey = caseClosed ? 'reOpenCaseWarningText' : 'closeCaseWarningText'

  if (caseItem.status !== CaseStatus.ON_HOLD)
    return null

  if (caseClosed && !canReopenCases)
    return null

  if (!caseClosed && !canCloseCases)
    return null

  const getButton = () => {
    if (compact) return (
      <IconButton size='small' onClick={openPopup} disabled={disabled}>
        {caseClosed ? (<LockOpenIcon />) : (<LockIcon />)}
      </IconButton>
    )

    return (
      <Button onClick={openPopup} variant='contained' disabled={disabled} sx={{ mx: 1 }}>
        {trlb(labelKey)}
      </Button>
    )
  }

  return (
    <>
      {getButton()}
      <StandardDialog
        open={popupOpen}
        onClose={closePopup}
        onConfirm={onConfirm}
        titleKey={titleKey}
        textKey={textKey}
      />
    </>
  )
}

export default CloseCaseButton
