import { RenderColumnBooleanType } from './columns/BooleanColumn'
import { RenderColumnNumberType } from './columns/NumberColumn'
import { RenderColumnStringType } from './columns/StringColumn'
import { RenderColumnDateType } from './columns/DateColumn'
import { RenderColumnObjectType } from './columns/ObjectColumn'
import { RenderColumnListType } from './columns/ListColumn'
import { RenderDateWithoutTimestampType } from './columns/DateWithoutTimestampColumn'
import { RenderColumnUniqueIdType } from './columns/UniqueIDColumn'
import { RenderEmailType } from './columns/EmailColumn'
import { RenderColumnTextWithPatternType } from './columns/TextWithPatternColumn'
import { ColumnRenderer } from '../types'
import { tEvaluatedColumnRepresentation } from 'universal-reporting/types/tEvaluatedTypes'
import { RenderColumnPriceType } from './columns/PriceColumn'
import { RenderColumnPositivePriceType } from './columns/PositivePriceColumn'
import { RenderColumnPositiveNumberType } from './columns/PositiveNumberColumn'
import { RenderColumnTwoDecimalNumberType } from './columns/TwoDecimalNumberColumn'
import { RenderColumnLocalizedTextType } from './columns/LocalizedTextColumn'
import { RenderColumnEnumType } from './columns/EnumColumn'
import { RenderColumnTimestampType } from './columns/TimestampColumn'
import { RenderColumnTableType } from './columns/TableColumn'
import { RenderColumnAccordionType } from './columns/AccordionColumn'

export const columnRenderers: {
  [K in tEvaluatedColumnRepresentation['viewAs']['representationKind']]: ColumnRenderer<K>
} = {
  number: RenderColumnNumberType,
  string: RenderColumnStringType,
  boolean: RenderColumnBooleanType,
  date: RenderColumnDateType,
  list: RenderColumnListType,
  object: RenderColumnObjectType,
  dateWithoutTimestamp: RenderDateWithoutTimestampType,
  price: RenderColumnPriceType,
  positivePrice: RenderColumnPositivePriceType,
  positiveNumber: RenderColumnPositiveNumberType,
  twoDecimalNumber: RenderColumnTwoDecimalNumberType,
  localizedText: RenderColumnLocalizedTextType,
  textWithPattern: RenderColumnTextWithPatternType,
  email: RenderEmailType,
  uniqueId: RenderColumnUniqueIdType,
  enum: RenderColumnEnumType,
  timestamp: RenderColumnTimestampType,
  table: RenderColumnTableType,
  accordion: RenderColumnAccordionType,
}
