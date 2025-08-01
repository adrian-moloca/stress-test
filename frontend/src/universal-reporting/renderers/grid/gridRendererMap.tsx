import { RenderNumberType } from './RenderNumberType'
import { RenderStringType } from './RenderStringType'
import { RenderBooleanType } from './RenderBooleanType'
import { RenderDateWithoutTimestampType } from './RenderDateWithoutTimestampType'
import { RenderTimestampType } from './RenderTimestampType'
import { RenderListType } from './RenderListType'
import { RenderObjectType } from './RenderObjectType'
import { RenderPriceType } from './RenderPriceType'
import { RenderDateType } from './RenderDateType'
import { RenderEnumType } from './RenderEnumType'
import { RenderPositivePriceType } from './RenderPositivePriceType'
import { RenderLocalizedTextType } from './RenderLocalizedTextType'
import { RenderTwoDecimalNumberType } from './RenderTwoDecimalNumberType'
import { RenderTextWithPatternType } from './RenderTextWithPatternType'
import { RenderPositiveNumberType } from './RenderPositiveNumberType'
import { RenderEmailType } from './RenderEmailType'
import { RenderUniqueIdType } from './RenderUniqueIdType'
import { RenderTableType } from './RenderTableType'
import { RenderAccordionType } from './RenderAccordionType'
import { tRenderer } from '../types'
import { tEvaluatedFieldRepresentation } from 'universal-reporting/types/tEvaluatedTypes'

export const gridRenderers: {
  [K in tEvaluatedFieldRepresentation['viewAs']['representationKind']]: tRenderer<K>
} = {
  string: RenderStringType,
  number: RenderNumberType,
  boolean: RenderBooleanType,
  date: RenderDateType,
  dateWithoutTimestamp: RenderDateWithoutTimestampType,
  timestamp: RenderTimestampType,
  object: RenderObjectType,
  price: RenderPriceType,
  textWithPattern: RenderTextWithPatternType,
  uniqueId: RenderUniqueIdType,
  email: RenderEmailType,
  positiveNumber: RenderPositiveNumberType,
  localizedText: RenderLocalizedTextType,
  positivePrice: RenderPositivePriceType,
  twoDecimalNumber: RenderTwoDecimalNumberType,
  enum: RenderEnumType,
  table: RenderTableType,
  list: RenderListType,
  accordion: RenderAccordionType
}
