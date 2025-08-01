import {
  systemConfigurationPermissions,
  systemConfigurationSections,
  tSystemEnvironmentConfig,
} from '@smambu/lib.constants'
import { SystemConfigurationApi } from 'api/systemConfiguration.api'
import { useDispatch } from 'react-redux'
import { CONFIG_ACTION, GLOBAL_ACTION } from 'store/actions'
import useCall from './useCall'
import { useGetCheckPermission } from './userPermission'

export const useGetSystemConfiguration = () => {
  const call = useCall()
  const dispatch = useDispatch()

  return () =>
    call(async function getSystemConfiguration () {
      const response = await SystemConfigurationApi.getSystemConfiguration()

      Object.entries(response).forEach(([section, data]) => {
        dispatch({
          type: CONFIG_ACTION.SET_CONFIG,
          data: {
            section,
            value: data,
          },
        })
      })

      return response
    })
}

export const useGetSystemConfigurationSection = () => {
  const call = useCall()
  const dispatch = useDispatch()

  return (section: systemConfigurationSections, superAdmin?: boolean, tenantId?: string) =>
    call(async function getSystemConfiguration () {
      const response =
        await SystemConfigurationApi.getSystemConfigurationSection({
          section, superAdmin, tenantId
        })

      Object.entries(response).forEach(([section, data]) => {
        dispatch({
          type: CONFIG_ACTION.SET_CONFIG,
          data: {
            section,
            value: data,
          },
        })
      })

      return response
    })
}

export const useSetAppCurrencySymbol = () => {
  const call = useCall()
  const dispatch = useDispatch()

  return () =>
    call(async function setAppCurrencySymbol () {
      const payload = { section: systemConfigurationSections.ENVIRONMENT_CONFIG }
      const response = await SystemConfigurationApi.getSystemConfigurationSection(payload)

      if (!response) throw new Error('systemConfiguration_noEnvConfigurations_error')

      const envconfigs = response.data as tSystemEnvironmentConfig
      const currencySymbol = envconfigs.currency

      dispatch({
        type: GLOBAL_ACTION.SET_APP_CURRENCY_SYMBOLS,
        data: currencySymbol,
      })
    })
}

export const useEditSystemConfiguration = () => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const dispatch = useDispatch()

  return (
    section: systemConfigurationSections,
    data: any,
    superAdmin?: boolean,
    tenantId?: string
  ) =>
    call(async function editSystemConfiguration () {
      const permission = checkPermission(systemConfigurationPermissions[section])
      if (!permission && !superAdmin) throw new Error('systemConfiguration_editNoPermission_error')

      await SystemConfigurationApi.editSystemConfigurationSection({
        section, data, superAdmin, tenantId
      })

      dispatch({
        type: CONFIG_ACTION.SET_CONFIG,
        data: {
          section,
          value: data,
        },
      })

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          type: 'success',
          text: 'systemConfiguration_edit_success',
        },
      })

      return true
    })
}
