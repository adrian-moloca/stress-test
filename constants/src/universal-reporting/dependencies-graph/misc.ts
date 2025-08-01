import { evaluateExpression } from '../../evaluateExpression'
import { tField, tExpression, tScope, tExecuteQuery, tEvaluateNamedExpression, tExecuteHttp, SUPPORTED_LOCALES, tSupportedLocales, tExpressionResult, tViewItem, tFieldDefinition } from '../../types'
import { getBackendExecuteHttp } from '../expressions'

export function isTfield (value: unknown):value is tField {
  if (value == null)
    return false

  if (typeof value !== 'object')
    return false

  const parsedValue = value as tField

  const hasId = parsedValue.id !== undefined
  const hasName = parsedValue.name !== undefined
  const hasVersion = parsedValue.version !== undefined

  if (!hasId)
    return false

  if (!hasName)
    return false

  if (!hasVersion)
    return false

  return isTFieldDefinition(parsedValue.definition)
}

export const isTFieldDefinition = (value: unknown): value is tFieldDefinition => {
  const parsedValue = value as tFieldDefinition
  const hasType = parsedValue?.type !== undefined
  const hasReadable = parsedValue.readable !== undefined
  const hasWritable = parsedValue.writable !== undefined
  const hasMergePolicy = parsedValue.mergePolicies !== undefined

  return hasType && hasReadable && hasWritable && hasMergePolicy
}

// XXX Careful: this function will skip most of the checks (like permissions, and so forth)
// NEVER USE THIS OUTSIDE OF A CONSUMER
export async function EvaluateBypassDependencies (expression: tExpression,
  scope: tScope,
  executeQuery: tExecuteQuery,
  evaluateNamedExpression: tEvaluateNamedExpression) {
  const executeHttp: tExecuteHttp = getBackendExecuteHttp()
  // XXX: locale should be irrelevant for this kind of evaluations. If not, please
  // change this accordingly
  const selectedLocale = Object.keys(SUPPORTED_LOCALES)[0] as tSupportedLocales

  const evaluated:tExpressionResult = await evaluateExpression({
    mainExpression: expression,
    firstScope: scope,
    selectedLocale,
    executeQuery,
    evaluateNamedExpression,
    executeHttp
  })

  return evaluated
}

export const isTViewItem = (obj: any): obj is tViewItem =>
  obj &&
    typeof obj === 'object' &&
    'viewAs' in obj &&
    typeof obj.viewAs === 'object' &&
    'representationKind' in obj.viewAs &&
    'fieldId' in obj &&
    'label' in obj &&
    'description' in obj &&
    'required' in obj &&
    'hide' in obj &&
    'override' in obj
