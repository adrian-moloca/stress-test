import {
  AxiosCancellationError,
  QueryAuditTrailDto,
  QueryLogDto,
  ToastType,
  permissionRequests,
} from '@smambu/lib.constants'
import useCall from './useCall'
import { useDispatch } from 'react-redux'
import { useCheckPermission } from './userPermission'
import { GLOBAL_ACTION } from 'store/actions'
import { LogApi } from 'api'

export const useGetAuditTrails = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const canViewAuditTrails = useCheckPermission(permissionRequests.canViewAuditTrails)

  return (queries?: QueryAuditTrailDto, abortController?: AbortController) =>
    call(async function getAuditTrails () {
      if (!canViewAuditTrails) {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            text: 'common_no_permission',
            type: ToastType.error,
          },
        })
        return
      }

      try {
        return await LogApi.getAuditTrails(queries, abortController)
      } catch (err: any) {
        if (!(err instanceof AxiosCancellationError))
          dispatch({
            type: GLOBAL_ACTION.ADD_TOAST,
            data: {
              text: err.stackTrace,
              type: ToastType.error,
            },
          })
        return null
      }
    })
}

export const useGetLogs = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const canViewLogs = useCheckPermission(permissionRequests.canViewLogs)

  return (queries?: QueryLogDto, abortController?: AbortController) =>
    call(async function getAuditLogs () {
      if (!canViewLogs) {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            text: 'common_no_permission',
            type: ToastType.error,
          },
        })
        return
      }

      return await LogApi.getLogs(queries, abortController)
    })
}
