import { Case, Identifier } from '@smambu/lib.constants'
import { CASES_ACTION } from 'store/actions'

interface ICasesState {
  [caseId: Identifier]: Case
}

const initialState: ICasesState = {}

export default function reducer (state = initialState, action: any): ICasesState {
  switch (action.type) {
    case CASES_ACTION.SET_CASE:
      return {
        ...state,
        [action.data.caseId]: action.data,
      }
    case CASES_ACTION.SET_CASES:
      const newCases = action.data.reduce(
        (acc: ICasesState, curr: Case) => ({ ...acc, [curr.caseId]: curr }),
        {} as ICasesState,
      )
      return {
        ...state,
        ...newCases,
      }
    default:
      return state
  }
}
