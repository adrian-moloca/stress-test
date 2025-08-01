import { tExpression, tDependentValue, tFieldType } from '../../types'
import { validateEmail, validateEnum, validateLocalizedText, validatePositivePrice, validateTextWithPattern, validateTimestamp, validateTwoDecimalsNumber, validateUser, valuateAddress, valuateLiteralDateWithoutTimestamp } from './evaluateLiteral'

export const stackStrings = {
  stringsToConcat: 'stringsToConcat',
  arraysToConcat: 'arraysToConcat',
  sourceArray: 'sourceArray',
  arrayToUnique: 'arrayToUnique',
  filterIndex: (index: number) => `filter[${index}]`,
  uniqueIndex: (index: number) => `unique[${index}]`,
  mapIndex: (index: number) => `map[${index}]`,
  listIndex: (index: number) => `[${index}]`,
  objectKey: (key: string) => `[${key}]`,
  query: 'query',
  yields: 'yields',
  forEachKey: (key: string) => `forEach[${key}]`,
  everyIndex: (index: number) => `every[${index}]`,
}

export const validateTypedExpression = ({
  expression,
  value,
}: {
  expression: tExpression
  value: tDependentValue['value']
}) => {
  if (expression.typeHint == null) return

  const throwError = (type: string) => {
    throw new Error(`expected ${type} not found, found ${typeof value}`)
  }

  const validators: Record<tFieldType['kind'], (value: tDependentValue['value']) => tDependentValue['value']> = {
    string: () => typeof value !== 'string' ? throwError('string') : null,
    number: () => typeof value !== 'number' ? throwError('number') : null,
    boolean: () => typeof value !== 'boolean' ? throwError('boolean') : null,
    object: () => typeof value !== 'object' ? throwError('object') : null,
    date: () => value instanceof Date ? null : throwError('date'),
    enum: () => validateEnum(value),
    list: () => Array.isArray(value) ? null : throwError('list'),
    address: () => valuateAddress(value),
    dateWithoutTimestamp: () => valuateLiteralDateWithoutTimestamp(value as unknown),
    price: () => typeof value !== 'number' ? throwError('price') : null,
    positivePrice: () => validatePositivePrice(value),
    timeStamp: () => validateTimestamp(value),
    positiveNumber: () => validatePositivePrice(value),
    twoDecimalNumber: () => validateTwoDecimalsNumber(value),
    localizedText: () => validateLocalizedText(value),
    textWithPattern: () => validateTextWithPattern(value),
    email: () => validateEmail(value),
    user: () => validateUser(value),
    uniqueId: () => typeof value !== 'string' ? throwError('uniqueId') : null,
  }

  try {
    const validationFunction = validators[expression.typeHint.kind]
    if (validationFunction == null) throw new Error(`type "${expression.typeHint.kind}" not supported`)
    validationFunction(value)
  } catch (error) {
    throw new Error(`error validating typedExpession "${expression.typeHint.kind}": ${error}`)
  }
}

export const isExpression = (value: unknown): value is tExpression => {
  return value !== null && typeof value === 'object' && 'expressionKind' in value
}
