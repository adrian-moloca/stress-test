/* eslint-disable no-unused-vars */
import { anagraphicsTypes } from '../enums'
import { tExpression, tTranslatableString } from './universal-billing'

export interface IAnagraphicField {
  type: 'address' | 'string' | 'number' | 'price' | 'date' | 'boolean'
  name: string
  labels?: tTranslatableString
  required?: boolean
  isKey?: boolean
  readonly?: boolean
  noCSV?: boolean
  isName?: boolean
  isPrice?: boolean
  noExport?: boolean
  specialField?: 'bgDebtorNumber'
  disabled?: boolean
}

export type IAnagraphicFields = IAnagraphicField[]

export type tBasicAnagraphicSetup = {
  collectionNames: Record<string, string>
  fields: IAnagraphicFields | Record<string, IAnagraphicFields>
  versioningEnabled: boolean
  uploadCSVEnabled: boolean
  permissionsRequests: {
    view: tExpression
    viewNames?: tExpression
    edit: tExpression
    export?: tExpression
    upload?: tExpression
    deleteVersion?: tExpression
  }
}

export type tStaticAnagraphicSetup = tBasicAnagraphicSetup & {
  anagraphicType: anagraphicsTypes
  subTypes?: anagraphicsTypes[]
}

export type tDynamicAnagraphicSetup = tBasicAnagraphicSetup & {
  anagraphicType: string
  typeLabels: tTranslatableString
  subTypes?: string[]
  subTypeLabels?: Record<string, tTranslatableString>
}

export type tFullAnagraphicSetup = (tStaticAnagraphicSetup | tDynamicAnagraphicSetup)

export type tEvaluatedAnagraphicSetup = tFullAnagraphicSetup & {
  index: number,
  permissionsRequests: {
    view: boolean
    viewNames?: boolean
    edit: boolean
    export?: boolean
    upload?: boolean
    deleteVersion?: boolean
  }
}

export type tAnagraphicsSetups = Record<string, tFullAnagraphicSetup>

export type IAnagraphicSetup = tEvaluatedAnagraphicSetup & {
  anagraphicType: string
  collectionName: string
  fields: IAnagraphicFields
  subTypes?: string[]
}

export type IAnagraphicRow = {
  id: number
  key: string
} & {
  [x: string]: string | number | Date | boolean
}

export type IAnagraphicVersion = {
  _id?: string
  createdAt?: Date
  updatedAt?: Date
  anagraphicType: string
  subType: string
  fromDate: Date
  rows: IAnagraphicRow[]
  new?: boolean
  nextVersion?: Omit<IAnagraphicVersion, 'rows' | 'nextVersion' | 'previousVersion'>
  previousVersion?: Omit<IAnagraphicVersion, 'rows' | 'nextVersion' | 'previousVersion'>
  tenantId: string
}

export type IAnagraphicDataVersion = {
  _id: string
  createdAt: Date
  updatedAt: Date
  anagraphicType: string
  subType: string
  fromDate: Date
  rows: (string | number | Date | boolean)[][]
  anagraphicFields: string[]
  tenantId: string
}

export interface IAnagraphicsGetRequest {
  anagraphicType: string
  subType?: string
  date?: Date
  versionId?: IAnagraphicVersion['_id']
  updatedAt?: Date
}

export interface IAnagraphicsPostRequest {
  anagraphicType: string
  subType?: string
}

export interface IAnagraphicsVersionPostRequest {
  anagraphicType: string
  subType?: string
  version: IAnagraphicVersion
}

export interface IAnagraphicsVersionDeleteRequest {
  anagraphicType: string
  subType?: string
  versionId: IAnagraphicVersion['_id']
}
export interface IAnagrapichisUserPermissions {
  view: boolean
  edit: boolean
  export: boolean
  upload: boolean
  deleteVersion: boolean
}
