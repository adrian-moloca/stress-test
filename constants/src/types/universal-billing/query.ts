import { Document, RootFilterQuery, SortOrder } from 'mongoose'
import { tBooleanType } from './base-types'
import { tDeps, tEmits, tExpression, tTypedExpression } from './expressions'
import { ObjectPath } from './utility-types'
import { UserPermissions } from '../permissions'
import { anagraphicsTypes } from '../../enums/anagraphics'

type tGenericQuery = Record<string, { kind: 'string' | 'number' | 'date' | 'boolean' }>

export type tSupportedQueries = {
  materialsDatabase: tGenericQuery,
  users: tGenericQuery,
  pricePointConfigs: tGenericQuery,
  generalData: tGenericQuery,
  cases: tGenericQuery,
  contracts: tGenericQuery,
  doctorOpStandards: tGenericQuery,
  anesthesiologistOpStandards: tGenericQuery,
  orManagement: tGenericQuery
  patients: tGenericQuery
}

export type tSupportedQueriesCollections = keyof tSupportedQueries
export type tSupportedQueriesArgs<
  T extends tSupportedQueriesCollections
> = keyof tSupportedQueries[T]

export type tExecuteQueryData = {
  collection: tSupportedQueriesCollections
  query: RootFilterQuery<Document>
  select: string[]
  sort?: { [key: string]: SortOrder }
  atDate?: Date
  __ignorePermissions?: boolean
}

export type tExecuteQuery = (data: tExecuteQueryData) => Promise<{
  value: Document[],
  deps: tDeps,
  emits: tEmits
}>

export type tExecuteQueryPayload = {
  query: RootFilterQuery<Document>
  select: string[]
  sort?: { [key: string]: SortOrder }
  atDate?: Date
  collection?: tSupportedQueriesCollections
  anagraphicType?: anagraphicsTypes
  subType?: anagraphicsTypes
  userPermissions: UserPermissions | undefined
  __ignorePermissions?: boolean
}

export type tQueryResultingFields<T extends tSupportedQueriesCollections> = Record<
  tSupportedQueriesArgs<T>,
  // Note: we use an expression rather than a "normal" field to allow for some
  // versatility later on, e.g. make this conditional or dependant on some
  // permissions
  tTypedExpression<tBooleanType>
>

export const SUPPORTED_WHERE_OPERATORS = {
  equalsOperator: 'equalsOperator',
  greaterThanOperator: 'greaterThanOperator',
  lessThanOperator: 'lessThanOperator',
  greaterOrEqualsThanOperator: 'greaterOrEqualsThanOperator',
  lessOrEqualsOperator: 'lessOrEqualsOperator',
  inOperator: 'inOperator',
  containsOperator: 'containsOperator',
  inRangeOperator: 'inRangeOperator:'
} as const

export type tSupportedWhereExpressions = keyof typeof SUPPORTED_WHERE_OPERATORS

export const QUERY_OPERATORS = {
  query: 'query',
  queryTie: 'queryTie',
  queryWhere: 'queryWhere',
  querySort: 'querySort',
  queryYields: 'queryYields',
  queryResultsSelector: 'queryResultsSelector'
}
export type tQueryOperators = keyof typeof QUERY_OPERATORS

export const QUERY_TIE_OPERATORS = ['AND', 'OR'] as const

export type tSupportedQueryTieOperators = typeof QUERY_TIE_OPERATORS[number]

export const QUERY_SELECTORS = ['first', 'exactlyOne', 'many'] as const

export type tSupportedQuerySelector = typeof QUERY_SELECTORS[number]

export type tAllowedPaths<T extends tSupportedQueriesCollections> = ObjectPath<tSupportedQueries[T]>

export type tQueryWhereExpression<T extends tSupportedWhereExpressions,
  K extends tSupportedQueriesCollections> = {
    expressionKind: 'queryWhere'
    path: tAllowedPaths<K>
    arg: tExpression
    operator: T
  }

export type tQueryTieOperator<T extends tSupportedQueryTieOperators> = {
  expressionKind: 'queryTie'
  tieOperator: T
  args: (tQueryWhereExpression<tSupportedWhereExpressions, tSupportedQueriesCollections> |
    tQueryTieOperator<tSupportedQueryTieOperators>)[]
}

export type tBaseQueryExpression<T extends tSupportedQueriesCollections> = {
  expressionKind: 'query'
  collection: T
  where?: tQueryTieOperator<tSupportedQueryTieOperators> |
   tQueryWhereExpression<tSupportedWhereExpressions, tSupportedQueriesCollections>
  sort?: tQuerySortExpression
  // Note for the implementation:
  // if undefined, the entire document will be returned
  yields?: tQueryResultingFields<T>
  __ignorePermissions?: boolean
}

type tAtDate = { atDate: tExpression }

export type tQuerySortExpression = {
  expressionKind: 'querySort'
  sort: tExpression
}

export type tQueryExpression<T extends tSupportedQueriesCollections> = tBaseQueryExpression<T> & (
  tBaseQueryExpression<T>['collection'] extends 'materialsDatabase' ? tAtDate : {}
);

export type tQueryResultsSelectorExpression<T extends tSupportedQueriesCollections,
  K extends tSupportedQuerySelector> = {
    expressionKind: 'queryResultsSelector'
    resultsType: K
    query: tQueryExpression<T>
  }

export type tQueryExpressions =
  | tQueryExpression<tSupportedQueriesCollections>
  | tQueryTieOperator<tSupportedQueryTieOperators>
  | tQueryWhereExpression<tSupportedWhereExpressions, tSupportedQueriesCollections>
  | tQueryResultsSelectorExpression<tSupportedQueriesCollections, tSupportedQuerySelector>
  | tQuerySortExpression

// TODO: Note for the future: we think that, at the moment, query joins are
// (at the moment)  overkill - BUT we thought and planned how to do them if it
// turns out that they are needed.
// Approach 1: we add a new type "tQueryJoinExpression" that has a "join" subfield
// and two generics, i.e.
// export type tQueryJoinExpression<T extends tSupportedQueriesCollections, K extends tSupportedQueriesCollections> = {
//   expressionKind: 'query'
//   collection: T
//   where: tQueryTieOperator<tSupportedQueryTieOperators>
//   yields: tPartialQueryArgs<T>
//   join<K>?: {
//     joinFields: tJoinFields<T,K>
//     query: tQueryExpression<K>
//   }
// }
// we then combine the original type and this new one in a union type, using never
// as needed to force one or the other
//
// Approach 2: we add a new type that describes the join operation between two
// query expressions, i.e.
// export type tQueryJoinOperatorExpression<T extends tSupportedQueriesCollections,
//   K extends tSupportedQueriesCollections> = {
//     expressionKind: 'queryJoin'
//     joinLeft: tQueryExpression<T>
//     joinRight: tQueryExpression<K>
//     joinFields: tJoinFields<T,K>
//     yields: tPartialQueryArgs<T | K>
//   }
//
// In both caseds we'll need to define a "tJoinFields<T extends tSupportedQueriesCollections, K extends tSupportedQueriesCollections>"
// type that allows a "map" of join fields to be created, mapping a
// field of T to a field of K

// TODO: Note for the future: this will be used to implement (for example) domain
// query in a better way, and should have features like "dynamic paths" to allow
// for more expression in completely dynamic environment.
// At the moment it is just a shorthand, for an easier refactoring later on.
export type tDynamicQueryExpression<T extends tSupportedQueriesCollections> = tQueryExpression<T>
