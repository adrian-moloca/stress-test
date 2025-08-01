import { Case } from './cases'
import { Identifier, Patient, InsuranceEntry, Contract } from './dataModel'
import { OperatingRoom } from './operatingRooms'
import { IUser } from './users'

export interface IntToast {
  toastId: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  code?: number
}

export interface IntToastPayload {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  code?: number
}

export interface IntConfigs {
  metricFunctionUrl: string
}

export type IntDateString = `${number}-${number}-${number}`
export const DateString = 'yyyy-MM-dd'
export type IntTimeString = `${number}:${number}`
export const TimeString = 'HH:mm:ss'

export interface ReduxUsers {
  [userId: Identifier]: Partial<IUser>
}

export interface IContractState {
  [contractId: Identifier]: Contract
}

export interface ReduxInsurances {
  [Nummer: Identifier]: InsuranceEntry
}

export interface ReduxOperatingRooms {
  [operatingRoomId: Identifier]: OperatingRoom
}

export interface ReduxCases {
  [caseId: Identifier]: Case
}

export interface ReduxPatients {
  [patientId: Identifier]: Patient
}

export interface ReduxConfigs {
  fileConfigs: {
    numberUploadLimit: number
    sizeUploadLimit: number
  }
  pricePointConfigs: {
    pricePoint: number
  }
  vatValueConfigs: {
    id: number
    fullPercentage: number
    halfPercentage: number
    validFrom: string
    validUntil: string
  }[]
}
