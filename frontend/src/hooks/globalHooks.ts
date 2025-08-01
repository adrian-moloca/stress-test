import { isValid } from 'date-fns'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'store'
import { GLOBAL_ACTION } from 'store/actions'

export const useSelectedDate = () => {
  const dispatch = useDispatch()
  const { selectedDate } = useAppSelector(state => state.global)
  const setSelectedDate = React.useCallback(
    (date: Date) => {
      if (!date || !isValid(date))
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            type: 'error',
            message: 'commons_invalid_date',
          },
        })
      else dispatch({ type: GLOBAL_ACTION.SET_SELECTED_DATE, data: date })
    },
    [dispatch],
  )

  return { date: selectedDate, setDate: setSelectedDate }
}
