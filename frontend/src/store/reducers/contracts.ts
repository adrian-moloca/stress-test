import { Contract, IContractState } from '@smambu/lib.constants'
import { CONTRACT_ACTION } from 'store/actions'

const initialState: IContractState = {}

export default function reducer (state = initialState, action: any): IContractState {
  switch (action.type) {
    case CONTRACT_ACTION.SET_CONTRACTS:
      const contracts = action.data.reduce(
        (acc: IContractState, contract: Contract) => ({
          ...acc,
          [contract.contractId]: contract,
        }),
        {},
      )
      return {
        ...state,
        ...contracts,
      }
    default:
      return state
  }
}
