import { BINARY_OPERATORS, LITERAL_OPERATORS, QUERY_OPERATORS, tBinaryExpression, tBinaryOperators, tEvaluateExpression, tExecuteQuery, tExpression, tDependentValue, tFunctionInvocation, tLiteralExpression, tLiteralOperators, tQueryExpression, tQueryOperators, tSupportedFunctionsNames, tSupportedLocales, tSupportedQueriesCollections, tScope, tTranslatableString, tUnaryExpression, tUnaryOperators, UNARY_OPERATORS, tHttpExpression, tEvaluateUtilities, tExecuteHttp, tEvaluateNamedExpression, tNamedExpression, tExpressionResult, PERMISSIONS_OPERATORS, tPermissionsOperators, tPermissionsExpression, tEmits, IGenericError } from '../types'
import { evaluateLiteral } from './subFunctions/evaluateLiteral'
import { evaluateBinary } from './subFunctions/evaluateBinary'
import { evaluateUnary } from './subFunctions/evaluateUnary'
import { evaluateFunction } from './subFunctions/evaluateFunction'
import { evaluateHttp } from './subFunctions/evaluateHttp'
import { evaluateQuery } from './subFunctions/evaluateQuery'
import { validateTypedExpression } from './subFunctions/optionals'
import { convertDepsToEmits, flatDependendValue, getNewDeps, getNewEmits, joinEmits } from './subFunctions/dependenciesFunctions'
import { evaluatePermissions } from './subFunctions/evaluatePermissions'
export { evaluateJSONs } from './evaluateJSONs'

export const evaluateExpression = async ({
  mainExpression,
  firstScope,
  selectedLocale,
  executeQuery,
  evaluateNamedExpression,
  executeHttp,
}: {
  mainExpression: tExpression
  firstScope: tScope
  selectedLocale: tSupportedLocales
  executeQuery: tExecuteQuery
  evaluateNamedExpression: tEvaluateNamedExpression
  executeHttp: tExecuteHttp
}): Promise<tExpressionResult> => {
  const stack = [] as string[]
  const warnings = [] as string[]
  let tempEmits = getNewEmits()

  try {
    const emitWarning = (warning: string) => {
      warnings.push(warning)
    }

    const getTranslation = (translatableString: tTranslatableString): string => {
      const translation = translatableString[selectedLocale]
      if (translation === undefined) throw new Error('translationNotFound')

      return translation
    }

    const appendStack = (value: string | tExpression) => {
      if (typeof value === 'string') stack.push(value)
      else stack.push(value.expressionKind)
    }

    const addTempEmits = (emits: tEmits | string) => {
      const newEmits = typeof emits === 'string' ? getNewEmits([{ path: emits }]) : emits
      tempEmits = joinEmits(tempEmits, newEmits)
    }

    const popStack = () => {
      stack.pop()
    }

    const innerEvaluate: tEvaluateExpression = async (expression, utilities) => {
      if (typeof expression !== 'object' || expression.expressionKind == null)
        throw new Error('invalidExpression')

      if (Array.isArray(expression))
        throw new Error('invalidArrayExpression')

      appendStack(expression)
      let result: tDependentValue

      switch (expression.expressionKind) {
        case LITERAL_OPERATORS[expression.expressionKind as tLiteralOperators]:
          const literalExpression = expression as tLiteralExpression
          const literalEvaluators = evaluateLiteral(utilities)
          result = await literalEvaluators[literalExpression.expressionKind](literalExpression)
          break

        case BINARY_OPERATORS[expression.expressionKind as tBinaryOperators]:
          const bynaryExpression = expression as tBinaryExpression
          const bynaryEvaluators = evaluateBinary(utilities)
          result = await bynaryEvaluators[bynaryExpression.expressionKind](bynaryExpression)
          break

        case UNARY_OPERATORS[expression.expressionKind as tUnaryOperators]:
          const unaryExpression = expression as tUnaryExpression
          const unaryEvaluators = evaluateUnary(utilities)
          result = await unaryEvaluators[unaryExpression.expressionKind](unaryExpression)
          break

        case PERMISSIONS_OPERATORS[expression.expressionKind as tPermissionsOperators]:
          const permissionsExpression = expression as tPermissionsExpression
          const permissionsEvaluators = evaluatePermissions(utilities)
          result = await permissionsEvaluators[permissionsExpression.expressionKind](
            permissionsExpression
          )
          break

        case 'functionInvocation':
          const functionExpression = expression as tFunctionInvocation<tSupportedFunctionsNames>
          const functionEvaluators = evaluateFunction(utilities)
          result = await functionEvaluators[functionExpression.function](functionExpression)
          break

        case 'http':
          const httpExpression = expression as tHttpExpression
          const httpEvaluators = evaluateHttp(utilities)
          result = await httpEvaluators[httpExpression.method](httpExpression)
          break

        case QUERY_OPERATORS[expression.expressionKind as tQueryOperators]:
          const queryExpression = expression as tQueryExpression<tSupportedQueriesCollections>
          result = await evaluateQuery(utilities)[queryExpression.expressionKind](queryExpression)
          break

        case 'namedExpression':
          const namedExpressionId = (expression as tNamedExpression).namedExpressionId
          const namedExpressionResult = await evaluateNamedExpression({
            namedExpressionId,
            scope: utilities.scope,
            selectedLocale,
          })
          result = {
            value: namedExpressionResult.value,
            deps: getNewDeps(),
            emits: namedExpressionResult.emits,
          }
          break
        default:
          throw new Error('invalidExpression')
      }

      const convertedDeps = convertDepsToEmits(result.deps)
      const joinedEmits = joinEmits(result.emits, convertedDeps)
      addTempEmits(joinedEmits)

      addTempEmits(joinEmits(result.emits, convertDepsToEmits(result.deps)))

      validateTypedExpression({ expression, value: result.value })

      popStack()
      return result
    }

    const firstUtilities: tEvaluateUtilities = {
      innerEvaluate,
      scope: firstScope,
      getTranslation,
      appendStack,
      popStack,
      executeHttp,
      executeQuery,
      emitWarning,
      addTempEmits,
    }

    const mainResult = await innerEvaluate(mainExpression, firstUtilities)

    const result = flatDependendValue(mainResult)
    return {
      ...result,
      warnings,
    }
  } catch (error) {
    return {
      value: undefined,
      error: (error as IGenericError).message,
      stack,
      warnings,
      emits: tempEmits,
    }
  }
}
