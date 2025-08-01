import { tContractsDynamicData, tDynamicDataList, tOPStandardDynamicData, tURConfigsData, tURConfigsDocuments } from '@smambu/lib.constants'
import { UrConfigApi } from 'api/ur/urconfig.api'
import { isAfter } from 'date-fns'
import useCall from 'hooks/useCall'
import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { DYNAMIC_DATA_CONFIGS, GLOBAL_ACTION } from 'store/actions'

export const useGetURConfigs = () => {
  const call = useCall()

  return (tenantId: string, version?: string): Promise<tURConfigsDocuments> =>
    call(async function useGetURConfigs () {
      const response = await UrConfigApi.getURConfigs(tenantId, version)

      return response
    })
}

export const useSetURConfigs = () => {
  const call = useCall()
  const dispatch = useDispatch()

  return (tenantId: string, data: tURConfigsData) =>
    call(async function useSetURConfigs () {
      const response =
        await UrConfigApi.setURConfigs(tenantId, data)

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          type: 'success',
          text: 'ur_configs_edit_success',
        },
      })

      return response
    })
}

export const useGetURConfigsLastUpdate = () => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  // we decided not to use `useCall` and don't show a toast since this is a background operation that the user is usually unaware of

  const checkURConfigsUpdated = useCallback(async () => {
    try {
      const response = await UrConfigApi.getURConfigsLastUpdate()

      if (response == null)
        return false

      const newDate = new Date(response)

      if (lastUpdate == null) {
        setLastUpdate(newDate)

        return false
      }

      return isAfter(newDate, lastUpdate)
    } catch (error) {
      console.error(error)
    }
  }, [lastUpdate])

  return { lastUpdate, checkURConfigsUpdated }
}

export const useGetDynamicData = () => {
  const call = useCall()
  const dispatch = useDispatch()

  return () =>
    call(async function useSetURConfigs () {
      const response =
        await UrConfigApi.getDynamicData()

      const data: tDynamicDataList = {
        cases: response.cases ?? [],
        anagraphics: response.anagraphics ?? [],
        capabilities: response.capabilites ?? [],
        contracts: {} as tContractsDynamicData,
        opStandards: {} as tOPStandardDynamicData
      }

      dispatch({
        type: DYNAMIC_DATA_CONFIGS.SET_ALL_DYNAMIC_DATA,
        data
      })

      return response
    })
}
