import { tExplorerData } from '@smambu/lib.constants'
import React from 'react'
import { SchedulingCasesApi } from 'api/schedulingCases.api'
import { useAppSelector } from 'store'
import useCallMemoized from './useCallMemoized'
import { isAfter, parseISO } from 'date-fns'

export const useGetExplorerData = () => {
  const { startDate, endDate } = useAppSelector(state => state.explorer)
  const [data, setData] = React.useState<tExplorerData | null>(null)
  const call = useCallMemoized()

  const getExplorerData = React.useCallback(() =>
    call(async function getExplorerData () {
      try {
        if (isAfter(parseISO(endDate), parseISO(startDate))) {
          const response = await SchedulingCasesApi.getExplorerData({ startDate, endDate })
          setData(response)

          return response
        } else {
          setData(null)
        }
      } catch (error) {
        console.error(error)
        setData(null)
      }
    }), [startDate, endDate])

  React.useEffect(() => {
    getExplorerData()
  }, [getExplorerData])

  return { getExplorerData, data }
}
