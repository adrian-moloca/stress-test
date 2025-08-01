import { IAnagraphicVersion } from '@smambu/lib.constants'
import { MATERIALS_DATABASE_ACTION } from 'store/actions'

type IAnagraphicsState = IAnagraphicVersion[]

const initialState: IAnagraphicsState = []

export default function reducer (state = initialState, action: any): IAnagraphicsState {
  switch (action.type) {
    case MATERIALS_DATABASE_ACTION.SET_VERSION:
      const index = state.findIndex((anag: IAnagraphicVersion) => anag._id === action.data._id)
      if (index === -1) return [...state, action.data]
      else
        return state.map((anag: IAnagraphicVersion) => {
          if (anag._id === action.data._id) return action.data

          return anag
        })
    default:
      return state
  }
}
