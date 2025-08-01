import { SortOrder } from 'mongoose'
import { tQueryExpression, tSupportedQueriesCollections, tQueryTieOperator, tQueryWhereExpression, tSupportedQueryTieOperators, tSupportedWhereExpressions, tExpression, tQueryOperators, tEvaluateUtilities, tQueryResultsSelectorExpression, tSupportedQuerySelector, tEvaluateQuery, tQuerySortExpression } from '../../types'
import { convertDepsToEmits, getNewDeps, getNewEmissions, getNewEmits, isDependentValue, joinDeps, joinEmits } from './dependenciesFunctions'
import { stackStrings } from './optionals'

export const evaluateQuery = (
  utilities: tEvaluateUtilities
): Record<tQueryOperators, tEvaluateQuery> => ({
  queryResultsSelector: async expression => {
    const queryResultsSelectorExpression = expression as tQueryResultsSelectorExpression<
      tSupportedQueriesCollections,
      tSupportedQuerySelector
    >
    const { value: evaluatedQuery, deps, emits } = await utilities.innerEvaluate(
      queryResultsSelectorExpression.query,
      utilities,
    )

    if (!Array.isArray(evaluatedQuery)) throw new Error('invalidQueryResult')

    switch (queryResultsSelectorExpression.resultsType) {
      case 'first':
        if (evaluatedQuery.length === 0) throw new Error('noResultsError')
        return {
          value: [evaluatedQuery[0]],
          deps,
          emits,
        }

      case 'exactlyOne':
        if (evaluatedQuery.length === 0) throw new Error('noResultsError')
        if (evaluatedQuery.length > 1) throw new Error('moreThanOneError')
        return {
          value: [evaluatedQuery[0]],
          deps,
          emits,
        }

      case 'many':
        return {
          value: evaluatedQuery,
          deps,
          emits,
        }

      default:
        throw new Error('invalidResultsType')
    }
  },
  query: async expression => {
    const queryExpression = expression as tQueryExpression<tSupportedQueriesCollections>
    let emits = getNewEmits()

    utilities.appendStack(stackStrings.query)
    let query = {}
    if (queryExpression.where != null) {
      const queryWhere = await utilities.innerEvaluate(queryExpression.where, utilities)
      query = queryWhere.value
      emits = joinEmits(emits, queryWhere.emits, convertDepsToEmits(queryWhere.deps))
    }
    utilities.popStack()

    utilities.appendStack(stackStrings.yields)
    const yieldsExpression: [string, tExpression][] = queryExpression.yields != null
      ? Object.entries(queryExpression.yields)
      : []

    let select = []
    for (const [key, value] of yieldsExpression) {
      utilities.appendStack(stackStrings.objectKey(key))
      const evaluatedValue = await utilities.innerEvaluate(value, utilities)
      if (evaluatedValue.value === true) {
        select.push(key)
        emits = joinEmits(emits, evaluatedValue.emits, convertDepsToEmits(evaluatedValue.deps))
      }

      utilities.popStack()
    }
    utilities.popStack()

    let sort = {}
    if (queryExpression.sort != null) {
      const sortExpression = await utilities.innerEvaluate(queryExpression.sort, utilities)
      sort = Object.fromEntries(Object.entries(sortExpression.value).map(([key, value]) => {
        if (isDependentValue(value)) {
          emits = joinEmits(emits, value.emits, convertDepsToEmits(value.deps))
          return [
            key,
            value.value as SortOrder
          ]
        }

        return [
          key,
          value as SortOrder
        ]
      }))
      emits = joinEmits(emits, sortExpression.emits, convertDepsToEmits(sortExpression.deps))
    }

    let atDate
    if ('atDate' in queryExpression) {
      const atDateResult = await utilities.innerEvaluate(queryExpression.atDate, utilities)
      atDate = atDateResult.value as Date
      emits = joinEmits(emits, atDateResult.emits, convertDepsToEmits(atDateResult.deps))
    }

    const collection = queryExpression.collection

    try {
      const result = await utilities.executeQuery!({
        query,
        select,
        sort,
        atDate,
        collection,
        __ignorePermissions: queryExpression.__ignorePermissions,
      })

      return {
        value: result.value,
        deps: result.deps,
        emits: joinEmits(emits, result.emits),
      }
    } catch (error) {
      console.error(error)
      throw new Error('queryError')
    }
  },
  querySort: async expression => {
    const querySortExpression = expression as tQuerySortExpression
    const { value: evaluatedSort, deps, emits } =
      await utilities.innerEvaluate(querySortExpression.sort, utilities)

    return {
      value: evaluatedSort,
      deps,
      emits,
    }
  },
  queryWhere: async expression => {
    const queryWhereExpression = expression as tQueryWhereExpression<
      tSupportedWhereExpressions,
      tSupportedQueriesCollections
    >
    const evaluatedPath = queryWhereExpression.path
    const { value: evaluatedArg, deps, emits } = await utilities.innerEvaluate(
      queryWhereExpression.arg,
      utilities,
    )

    const getOperator = (operator: tSupportedWhereExpressions): string => {
      if (operator === 'equalsOperator') return '$eq'
      if (operator === 'greaterThanOperator') return '$gt'
      if (operator === 'lessThanOperator') return '$lt'
      if (operator === 'greaterOrEqualsThanOperator') return '$gte'
      if (operator === 'lessOrEqualsOperator') return '$lte'
      if (operator === 'inOperator') return '$regex'
      if (operator === 'containsOperator') return '$regex'
      if (operator === 'inRangeOperator') return '$regex'
      throw new Error('invalidOperator')
    }

    const getRegex = (operator: tSupportedWhereExpressions, arg: string): string => {
      if (operator === 'inOperator') return `.*${arg}.*`
      if (operator === 'containsOperator') return `.*${arg}.*`
      if (operator === 'inRangeOperator') return `.*${arg}.*`

      throw new Error('invalidOperator')
    }

    if (queryWhereExpression.operator === 'inOperator' ||
      queryWhereExpression.operator === 'containsOperator' ||
      queryWhereExpression.operator === 'inRangeOperator')
      return {
        value: {
          [evaluatedPath]: {
            [getOperator(queryWhereExpression.operator)]:
              getRegex(queryWhereExpression.operator, evaluatedArg as string)
          }
        },
        deps: getNewDeps(),
        emits: joinEmits(convertDepsToEmits(deps), emits),
      }

    return {
      value: {
        [evaluatedPath]: {
          [getOperator(queryWhereExpression.operator)]: evaluatedArg
        },
      },
      deps: getNewDeps(),
      emits: joinEmits(convertDepsToEmits(deps), emits),
    }
  },
  queryTie: async expression => {
    const queryTieExpression = expression as tQueryTieOperator<tSupportedQueryTieOperators>
    const evaluatedArgsResults = await Promise.all(
      queryTieExpression.args.map(async arg => utilities.innerEvaluate(arg, utilities)),
    )

    const evaluatedArgs = evaluatedArgsResults.map(({ value }) => value)
    const emissions = evaluatedArgsResults.reduce((acc, { deps, emits }) => ({
      deps: joinDeps(acc.deps, deps),
      emits: joinEmits(acc.emits, emits),
    }), getNewEmissions())

    const getTieOperator = (string: tSupportedQueryTieOperators): string => {
      if (string === 'AND') return '$and'
      if (string === 'OR') return '$or'
      throw new Error('invalidTieOperator')
    }

    return {
      value: {
        [getTieOperator(queryTieExpression.tieOperator)]: evaluatedArgs
      },
      ...emissions
    }
  },
  queryYields: async expression => {
    const queryYieldsExpression = expression as tQueryExpression<tSupportedQueriesCollections>
    if (!queryYieldsExpression) return { value: '', ...getNewEmissions() }

    const entries = Object.entries(queryYieldsExpression)
    if (entries.some(([key, value]) => typeof key !== 'string' || typeof value !== 'object'))
      throw new Error('invalidYields')

    const evaluatedEntries = []
    for (const [key, value] of entries) {
      const evaluatedValue = await utilities.innerEvaluate(value as tExpression, utilities)
      evaluatedEntries.push([key, evaluatedValue.value])
    }

    const value = evaluatedEntries
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key)
    return { value, ...getNewEmissions() }
  }
})
