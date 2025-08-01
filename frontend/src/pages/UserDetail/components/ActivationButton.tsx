import { DefaultButton } from 'components/Buttons'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { permissionRequests } from '@smambu/lib.constants'
import { trlb } from 'utilities'

const ActivationButton = ({
  active,
  edit,
  disabled,
  changeActiveStatus,
}: {
  active?: boolean
  edit?: boolean
  disabled?: boolean
  changeActiveStatus: () => void
}) => {
  const checkPermission = useGetCheckPermission()
  const canActivateUser = checkPermission(permissionRequests.canActivateUser)

  if (!canActivateUser || !edit) return null

  return (
    <DefaultButton
      text={trlb(active ? 'userDetails_deactivate_user' : 'userDetails_activate_user')}
      onClick={changeActiveStatus}
      disabled={disabled}
    />
  )
}

export default ActivationButton
