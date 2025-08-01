import { Contract, permissionRequests } from '@smambu/lib.constants'
import { DeleteButton } from 'components/Buttons'
import StandardDialog from 'components/StandardDialog'
import { useDeleteOpStandard } from 'hooks/contractHooks'
import { useCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useNavigate } from 'react-router-dom'

type Props = {
  isLoading: boolean
  opStandardId?: string
  contract?: Contract
  edit: boolean
  opstandardUses: number
}

const DeleteOpStandard = ({ isLoading, opStandardId, contract, edit, opstandardUses }: Props) => {
  const [open, setOpen] = React.useState(false)
  const canDeleteOpStandard = useCheckPermission(permissionRequests.canDeleteOpStandard,
    { contract })
  const deleteOpStandard = useDeleteOpStandard()
  const navigate = useNavigate()

  if (!canDeleteOpStandard || !edit || opStandardId === null || opStandardId === undefined || opStandardId === '')
    return null

  const onConfirm = async () => {
    await deleteOpStandard(opStandardId, contract?.contractId)
    navigate(contract?.contractId ? `/contracts/${contract?.contractId}/edit` : '/contracts')
    setOpen(false)
  }

  const closeDialog = () => setOpen(false)

  const getDialog = () => {
    if (opstandardUses > 0)
      return (
        <StandardDialog
          open={open}
          onClose={closeDialog}
          titleKey={'opstandard_deletion_forbidden_title'}
          textKey={'opstandard_deletion_forbidden_text'}
          textVars={{ nOfCases: opstandardUses }}
        />
      )

    return (
      <StandardDialog
        open={open}
        onClose={closeDialog}
        titleKey={'op_standard_delete_title'}
        textKey={'op_standard_delete_text'}
        onConfirm={onConfirm}
      />
    )
  }

  return (
    <>
      <DeleteButton onClick={() => setOpen(true)} disabled={isLoading} />
      {getDialog()}
    </>
  )
}

export default DeleteOpStandard
