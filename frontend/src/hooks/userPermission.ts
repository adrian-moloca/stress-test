import { useAppSelector } from 'store'

import {
  permissionRequestProps,
  permissionRequests,
  permissionRequestsFunctions,
  disablePermissionsCheck,
} from '@smambu/lib.constants'

export const useCheckPermission = (permissionRequest?: permissionRequests,
  props: permissionRequestProps = {}) => {
  const userPermissions = useAppSelector(state => state.auth?.permissions ?? {})
  const { user } = useAppSelector(state => state.auth)

  if (!permissionRequest) return false
  return (
    disablePermissionsCheck ||
    (permissionRequestsFunctions[permissionRequest]?.({
      userPermissions,
      user,
      props,
    }) ??
      false)
  )
}

export const useGetCheckPermission = () => {
  const userPermissions = useAppSelector(state => state.auth?.permissions ?? {})
  const { user } = useAppSelector(state => state.auth)

  return (permissionRequest?: permissionRequests, props: permissionRequestProps = {}) =>
    permissionRequest == null
      ? false
      : disablePermissionsCheck ||
        (permissionRequestsFunctions[permissionRequest]?.({
          userPermissions,
          user,
          props,
        }) ??
          false)
}

export const useGetSingleCheckPermission = (permissionRequest?: permissionRequests) => {
  const userPermissions = useAppSelector(state => state.auth?.permissions ?? {})
  const { user } = useAppSelector(state => state.auth)

  return (props: permissionRequestProps) =>
    !permissionRequest
      ? false
      : disablePermissionsCheck ||
        (permissionRequestsFunctions[permissionRequest]?.({
          userPermissions,
          user,
          props,
        }) ??
          false)
}
