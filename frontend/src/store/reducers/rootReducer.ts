import auth from './auth'
import filters from './filters'
import global from './global'
import cases from './cases'
import limitedCases from './limitedCases'
import draftContract from './draftContract'
import explorer from './explorer'
import operatingRooms from './operatingRooms'
import orScheduling from './orScheduling'
import users from './users'
import roles from './roles'
import configs from './configs'
import materialsDatabase from './materialsDatabase'
import contracts from './contracts'
import scheduling from './scheduling'
import tenants from './tenants'
import language from './language'
import dynamicData from './dynamicData'
import { combineReducers } from 'redux'
import { TypedUseSelectorHook, useSelector } from 'react-redux'
import anesthesiologistsSchedule from './anesthesiologistsSchedule'

export const rootReducer = combineReducers({
  auth,
  filters,
  global,
  cases,
  limitedCases,
  draftContract,
  explorer,
  operatingRooms,
  orScheduling,
  users,
  contracts,
  materialsDatabase,
  roles,
  scheduling,
  configs,
  anesthesiologistsSchedule,
  language,
  tenants,
  dynamicData
})

export type RootState = ReturnType<typeof rootReducer>
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
