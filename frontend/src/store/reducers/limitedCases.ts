import { Case, ILimitedCase, Identifier } from '@smambu/lib.constants'
import { LIMITED_CASES_ACTION } from 'store/actions'

interface ILimitedCasesState {
  [caseId: Identifier]: ILimitedCase
}

const initialState: ILimitedCasesState = {}

export default function reducer (state = initialState, action: any): ILimitedCasesState {
  switch (action.type) {
    case LIMITED_CASES_ACTION.SET_CASE:
      return {
        ...state,
        [action.data.caseId]: action.data,
      }

    case LIMITED_CASES_ACTION.SET_CASES:
      const newLimitedCases = action.data.reduce(
        (acc: ILimitedCasesState, curr: Case) => ({ ...acc, [curr.caseId]: curr }),
        {} as ILimitedCasesState,
      )

      return newLimitedCases

    default:
      return state
  }
}
