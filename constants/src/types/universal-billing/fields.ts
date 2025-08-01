/* eslint-disable etc/no-commented-out-code */
import {
  tAddress,
  tDateWithoutTimestamp,
  tEmail,
  tLocalizedText,
  tPositiveNumber,
  tPositivePrice,
  tPrice,
  tTextWithPattern,
  tTimestamp,
  tTwoDecimalNumber,
  tUniqueId,
  tUser,
} from './advanced-types'
import {
  tBooleanType,
  tDateType,
  tEnum,
  tList,
  tNumberType,
  tObject,
  tStringType,
  tTranslatableString,
} from './base-types'
import { tHorizontalMergingPolicies, tVerticalMergingPolicies } from './dependencies-graph'
import { tCondition, tExpression, tTypedExpression } from './expressions'

export type tBaseFieldType =
  | tNumberType
  | tStringType
  | tBooleanType
  | tDateType
  | tEnum
  | tList
  | tObject

export type tAdvancedFieldType =
  | tAddress
  | tDateWithoutTimestamp
  | tPrice
  | tPositivePrice
  | tTimestamp
  | tPositiveNumber
  | tTwoDecimalNumber
  | tLocalizedText
  | tTextWithPattern
  | tEmail
  | tUser
  | tUniqueId

export type tFieldType = tBaseFieldType | tAdvancedFieldType

export type tFieldDefinition = {
  automaticValue?: tExpression
  type: tFieldType
  readable: tTypedExpression<tBooleanType>
  writable: tTypedExpression<tBooleanType>
  mergePolicies: {
    vertical: tVerticalMergingPolicies
    horizontal: tHorizontalMergingPolicies
  }
  condition?: tCondition
}

// A little documentation for the tField, on the tricky subfields
// The "version" is used to determine if a given field was updated (or changed
// in any way) when a new configuration gets uploaded - it can be any string,
// since the comparison is done at the "equals" level.
//
// The "condition" is an optional condition expression which is used to
// determine multiple things, like:
// - if the corresponding dependencies graph node should be evaluated;
// - if the field should be included in the proxy evaluation, display, and so on;
// Simple example: a condition could say something like "Only if the case category
// is A2".
export type tField = {
  id: string
  name?: tTranslatableString
  definition: tFieldDefinition
  version: string
}

export interface tBaseFieldRepresentation {
  fieldId: string
  label: tTranslatableString
  description: tTranslatableString
  override: tTypedExpression<tBooleanType>
  required: tTypedExpression<tBooleanType>
  hide: tTypedExpression<tBooleanType>
  viewAs: tViewAs
  displayExpression?: tExpression
}

export type tFieldRepresentation = tBaseFieldRepresentation & {
  span: ZeroToTwelve
  margin: ZeroToTwelve
}

export type tContainerRepresentation = {
  [K in `_${string}`]: tViewItem[]
}

export type tViewItem = tFieldRepresentation // | tContainerRepresentation; //TODO: i temporary disabled containerRepresentations!!! first. they might be deprecated soon because of viewAs and absolute path fields. second: a pain. check mapper.ts

export type TableSpan = { flex: number; width?: never } | { width: number; flex?: never }

export type ZeroToTwelve = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type tRepresentation = tViewItem[]

export type tColumnRepresentation = tBaseFieldRepresentation & {
  searchFullText: tTypedExpression<tBooleanType>
  filterable: tTypedExpression<tBooleanType>
  span: TableSpan
}

type tSupportedRepresentations = {
  String: 'string'
  Number: 'number'
  Boolean: 'boolean'
  Date: 'date'
  DateWithoutTimestamp: 'dateWithoutTimestamp'
  Timestamp: 'timeStamp'
  Object: 'object'
  TextWithPattern: 'textWithPattern'
  Email: 'email'
  Price: 'price'
  UniqueId: 'uniqueId'
  PositiveNumber: 'positiveNumber'
  LocalizedText: 'localizedText'
  TwoDecimalNumber: 'twoDecimalNumber'
  PositivePrice: 'positivePrice'
  Enum: 'enum'
  Table: 'table'
  List: 'list'
  Accordion: 'accordion'
}

export type tRepresentationKind = keyof tSupportedRepresentations
export const LABEL_FIELD = 'labelField'
export type RepresentationMap = {
  Number: { representationKind: 'number' }
  String: { representationKind: 'string' }
  Boolean: { representationKind: 'boolean' }
  Date: { representationKind: 'date'; format: string; timezone?: string }
  DateWithoutTimestamp: {
    representationKind: 'dateWithoutTimestamp'
    format: string
    timezone?: string
  }
  Timestamp: { representationKind: 'timestamp'; format: string }
  Email: { representationKind: 'email' }
  Price: { representationKind: 'price'; currency: string }
  UniqueId: { representationKind: 'uniqueId' }
  TextWithPattern: { representationKind: 'textWithPattern'; format: RegExp }
  PositiveNumber: { representationKind: 'positiveNumber' }
  PositivePrice: { representationKind: 'positivePrice'; currency: string }
  LocalizedText: { representationKind: 'localizedText' }
  TwoDecimalNumber: { representationKind: 'twoDecimalNumber' }
  Table: { representationKind: 'table'; columns: tColumnRepresentation[]; rowId: string }
  Object: { representationKind: 'object'; subFields: tViewItem[] }
  List: { representationKind: 'list'; field: tViewItem }
  Accordion: { representationKind: 'accordion'; subFields: tViewItem[] }
  Enum: { representationKind: 'enum'; idField?: string; [LABEL_FIELD]: tTypedExpression<tList> }
}

export type tViewAs = RepresentationMap[keyof RepresentationMap]

type VerifyRepresentationMapComplete = keyof RepresentationMap extends tRepresentationKind
  ? tRepresentationKind extends keyof RepresentationMap
    ? true
    : never
  : never
const _checkRepresentationMapComplete: VerifyRepresentationMapComplete = true
