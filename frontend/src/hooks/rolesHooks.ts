import {
  formatCapabilities,
  formatEditRoleRequest,
  ICreateRoleRequest,
  IEditRoleRequest,
  IFormattedCapability,
  IRoles,
  permissionRequests,
  Role,
  tPermissionDomains,
} from '@smambu/lib.constants'
import { RolesApi } from 'api'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { GLOBAL_ACTION, ROLES_ACTION } from 'store/actions'
import { routes } from 'routes/routes'
import { getLanguage, trlb } from 'utilities'
import useCall from './useCall'
import { useCheckPermission } from './userPermission'
import { useAppSelector } from 'store'

export const useGetCapabilitiesList = (): {
  capabilitiesList: IFormattedCapability[],
  domains: tPermissionDomains
} => {
  const language = getLanguage()
  const dynamicCapabilities = useAppSelector(
    state => state.dynamicData.capabilities
  )

  const { capabilitiesList, domains } = React.useMemo(() => {
    return formatCapabilities(trlb, language, dynamicCapabilities)
  }, [dynamicCapabilities, language])

  return {
    capabilitiesList,
    domains
  }
}

export const useGetRoles = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const canViewRoles = useCheckPermission(permissionRequests.canViewRoles)

  React.useEffect(() => {
    if (!canViewRoles) return
    call(async function getRoles () {
      const res = await RolesApi.findAll()
      dispatch({
        type: ROLES_ACTION.GET_ROLES_SUCCESS,
        data: res.reduce(
          (obj: IRoles, role: Role) => ({ ...obj, [role.id]: role }),
          {},
        ),
      })
    })
  }, [])
}

interface IUpdateRoleRequest {
  roleId?: string
  values: Partial<Role>
}

export const useUpdateRole = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const navigate = useNavigate()

  return ({ roleId, values }: IUpdateRoleRequest) =>
    call(async function updateRole () {
      if (!roleId) {
        await RolesApi.createRole(values as ICreateRoleRequest)
      } else {
        const data = formatEditRoleRequest(values)
        await RolesApi.editRole(roleId, data as IEditRoleRequest)
      }
      navigate(routes.rolesList)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: trlb(!roleId ? 'role_create_success' : 'role_edit_success', {
            name: values.name ?? '',
          }),
          type: 'success',
        },
      })
    })
}

export const useDeleteRole = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const navigate = useNavigate()

  return (role: Role) =>
    call(async function deleteRole () {
      await RolesApi.deleteOne(role)
      navigate(routes.rolesList)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: trlb('role_delete_success', { name: role.name }),
          type: 'success',
        },
      })
    })
}
