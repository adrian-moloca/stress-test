import React from 'react'
import { Box, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { CaseStatus, permissionRequests } from '@smambu/lib.constants'
import { routes } from 'routes/routes'
import { useNavigate } from 'react-router'
import { useCheckPermission } from 'hooks/userPermission'
import { useAppSelector } from 'store'

export const CaseIdCell = ({ params }: { params: any }) => {
  const navigate = useNavigate()
  const caseItem = useAppSelector(state => state.cases[params.row.caseId])
  const canEditCase = useCheckPermission(permissionRequests.canEditCase, { caseItem })

  if (canEditCase && params.row.status !== CaseStatus.BILLED)
    return (
      <Box sx={{ cursor: 'pointer', display: 'flex' }}>
        <IconButton
          onClick={e => {
            e.stopPropagation()
            navigate(`${routes.cases}/${params.row.caseId}/edit`)
          }}
          size='small'
        >
          <EditIcon color='primary' />
        </IconButton>
      </Box>
    )
  else return null
}
