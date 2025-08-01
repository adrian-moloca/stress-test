import { Contract } from '@smambu/lib.constants'
import { DRAFT_CONTRACT_ACTION } from 'store/actions'

const initialState: Omit<Contract, 'contractId'> = {} as Omit<Contract, 'contractId'>

export default function reducer (state = initialState, action: any): Omit<Contract, 'contractId'> {
  switch (action.type) {
    case DRAFT_CONTRACT_ACTION.SET_DRAFT_CONTRACT:
      return action.data
    case DRAFT_CONTRACT_ACTION.RESET_DRAFT_CONTRACT:
      return {} as Omit<Contract, 'contractId'>
    case DRAFT_CONTRACT_ACTION.ADD_DRAFT_CONTRACT_OPSTANDARD:
      return {
        ...state,
        opStandards: {
          ...(state.opStandards ?? {}),
          [action.data.opStandardId]: action.data,
        },
      }
    default:
      return state
  }
}
