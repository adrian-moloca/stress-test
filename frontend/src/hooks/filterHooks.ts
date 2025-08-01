import { filtersSections } from '@smambu/lib.constants'
import { capitalize } from '@mui/material'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'store'
import { FILTERS_ACTION } from 'store/actions'
import { tFiltersState } from 'store/reducers/filters'

export const useReduxFilters = <tSection extends keyof tFiltersState>(section: filtersSections) => {
  const dispatch = useDispatch()
  const filters = useAppSelector(state => state.filters[section]) as tFiltersState[tSection]

  const setFilter = <tKey extends keyof tFiltersState[tSection]>(
    key: tKey,
    value: tFiltersState[tSection][tKey]
  ) => {
    dispatch({
      type: FILTERS_ACTION.SET_SECTION_FILTER,
      section,
      data: { [key]: value }
    })
  }

  const getSetFilter = <tKey extends keyof tFiltersState[tSection]>(key: tKey) =>
    (value: tFiltersState[tSection][tKey]) => {
      setFilter(key, value)
    }

  const resetSection = () => {
    dispatch({ type: FILTERS_ACTION.RESET_SECTION, section })
  }

  const setterFunctions = useMemo(() => Object.keys(filters).reduce((acc, key) => ({
    ...acc,
    [`set${capitalize(key)}`]: getSetFilter(key as keyof tFiltersState[tSection])
  }), {} as {
    [tKey in keyof tFiltersState[tSection] as (`set${Capitalize<Extract<tKey, string>>}`)]:
    (value: tFiltersState[tSection][tKey]) => void
  }), [filters])

  return {
    ...filters,
    ...setterFunctions,
    resetSection,
  }
}
