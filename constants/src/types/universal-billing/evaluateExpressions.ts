import { tBinaryExpression, tExpression, tDependentValue, tUnaryExpression, tExpressionResult, tEmits } from './expressions'
import { tFunctionInvocation, tSupportedFunctionsNames } from './functions'
import { tLiteralExpression } from './literals'
import { tScope, tSupportedLocales } from './misc'
import { tExecuteQuery, tQueryExpressions } from './query'
import { tTranslatableString } from './base-types'
import { tHttpExpression } from './httpQuery'
import { tPermissionsExpression } from './permissions'

export type tEvaluateUtilities = {
  innerEvaluate: tEvaluateExpression,
  scope: tScope,
  getTranslation: (translatableString: tTranslatableString) => string,
  appendStack: (value: string | tExpression) => void,
  popStack: () => void,
  executeHttp: tExecuteHttp | undefined,
  executeQuery: tExecuteQuery | undefined,
  emitWarning: (warning: string) => void,
  addTempEmits: (emits: tEmits | string) => void,
  lambdaArgs?: string[],
}

export type tEvaluateExpression = (
  expression: tExpression,
  utilities: tEvaluateUtilities,
) => Promise<tDependentValue>

export type tEvaluateLiteral = (expression: tLiteralExpression) => Promise<tDependentValue>
export type tEvaluateBinary = (expression: tBinaryExpression) => Promise<tDependentValue>
export type tEvaluateUnary = (expression: tUnaryExpression) => Promise<tDependentValue>
export type tEvaluateQuery = (expression: tQueryExpressions) => Promise<tDependentValue>
export type tEvaluateFunction = (
  expression: tFunctionInvocation<tSupportedFunctionsNames>,
) => Promise<tDependentValue>
export type tEvaluateHttp = (expression: tHttpExpression) => Promise<tDependentValue>
export type tEvaluatePermissions = (expression: tPermissionsExpression) => Promise<tDependentValue>

export type tExecuteHttp = (
  method: string,
  url: string,
  body: BodyInit | undefined,
) => Promise<tDependentValue>

export type tEvaluateNamedExpression = (
  data: tEvaluateNamedExpressionData,
) => Promise<tExpressionResult>

export type tEvaluateNamedExpressionData = {
  namedExpressionId: string,
  scope: tScope,
  selectedLocale: tSupportedLocales,
}
