/* eslint-disable react-hooks/rules-of-hooks */
import { ReduxConfigs } from '@smambu/lib.constants'
import { useDispatch } from 'react-redux'
import { CONFIG_ACTION } from 'store/actions'
import useCall from './useCall'

export const saveConfigs = () => {
  const dispatch = useDispatch()
  const call = useCall()

  return (configs: ReduxConfigs) =>
    call(async function saveConfigs () {
      await configs.saveConfigs(configs)
      // eslint-disable-next-line no-undef
      dispatch({ type: CONFIG_ACTION.SET_CONFIGS, data: values })
    })
}
