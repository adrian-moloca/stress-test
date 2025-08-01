import { AxiosCancellationError } from '@smambu/lib.constants'
import { ACCESS_TOKEN, ACCESS_TOKEN_WITHOUT_TENANT, ERRORS_FORCING_LOGOUT } from 'config/constant'
import { useDispatch } from 'react-redux'
import { AUTH_ACTION, GLOBAL_ACTION } from 'store/actions'
import { getErrorMessage } from 'utilities/getErrorMessage'

const useCreateError = (): Function => {
  const dispatch = useDispatch()

  return (error: Error): void => {
    try {
      if (ERRORS_FORCING_LOGOUT.includes(error.message)) {
        dispatch({ type: AUTH_ACTION.LOG_OUT })

        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(ACCESS_TOKEN_WITHOUT_TENANT)

        window.location.reload()
      }

      console.error(error)
      const text = getErrorMessage(error)

      if (error instanceof AxiosCancellationError) return
      dispatch({ type: GLOBAL_ACTION.ADD_TOAST, data: { text, type: 'error' } })
    } catch (error) {
      console.error(error)
    }
  }
}

export default useCreateError
