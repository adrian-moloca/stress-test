import { AnesthesiologistOpStandard, permissionRequests } from '@smambu/lib.constants'
import { DeleteButton } from 'components/Buttons'
import StandardDialog from 'components/StandardDialog'
import { useDeleteAnesthesiologistOpStandard } from 'hooks'
import { useCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useAppSelector } from 'store'

const DeleteAnesthestiologistOpStandard = ({
  anesthesiologistOpStandard,
}: {
  anesthesiologistOpStandard: AnesthesiologistOpStandard
}) => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const deleteHook = useDeleteAnesthesiologistOpStandard()
  const canDeleteAnesthestiologistOpStandard = useCheckPermission(
    permissionRequests.canDeleteAnesthesiologistOpStandard,
    {
      anesthesiologistOpStandard,
    },
  )
  const [deleteModal, setDeleteModal] = React.useState(false)

  if (!canDeleteAnesthestiologistOpStandard) return null

  return (
    <>
      <DeleteButton
        disabled={isLoading}
        onClick={() => setDeleteModal(true)}
      />
      <StandardDialog
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        titleKey={'anesthestiologistOpStandard_delete_title'}
        textKey={'anesthestiologistOpStandard_delete_text'}
        textVars={{ name: anesthesiologistOpStandard.name }}
        onConfirm={() => deleteHook(anesthesiologistOpStandard.anesthesiologistOpStandardId)}
      />
    </>
  )
}

export default DeleteAnesthestiologistOpStandard
