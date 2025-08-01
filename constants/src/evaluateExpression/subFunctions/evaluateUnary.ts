import { tDotExpression, tEvaluateUnary, tEvaluateUtilities, tExpression, tLambdaExpression, tNotExpression, tSymbolExpression, tSelfExpression, tUnaryOperators, tWarningExpression, tRuleExpression, tRulesExpression, tDependentValue, tDeps, tEmits, tErrorExpression, tIsUndefinedExpression, tTryExpression, tOrExpression, tAndExpression } from '../../types'
import { convertDepsToEmits, getNewDeps, getNewEmissions, getNewEmits, getValue, isDependentValue, joinEmits } from './dependenciesFunctions'
import { prettifyObject } from '../../utils'
import { isExpression } from './optionals'

export const getLambdaArgs = (expression: tExpression, expected?: number): string[] => {
  const lambdaExpression = expression as tLambdaExpression
  if (!Array.isArray(lambdaExpression.args) || lambdaExpression.args.some(a => typeof a !== 'string'))
    throw new Error('invalidArguments')

  if (expected !== undefined && lambdaExpression.args.length !== expected) throw new Error('invalidArgumentsLength')

  return lambdaExpression.args
}

export const traverseValue = (
  obj: tDependentValue,
  paths: (string | number)[]
): tDependentValue => {
  let currentDeps: tDeps = getNewDeps(obj.deps)
  let currentEmits: tEmits = getNewEmits(obj.emits)
  let current = getValue(obj)

  for (const path of paths) {
    if (current == null ||
      typeof current !== 'object' ||
      (Array.isArray(current) &&
      !Number.isInteger(path))
    )
      throw new Error(`invalid parent "${JSON.stringify(current)}" for ${path}`)

    const next = (current as Record<string, tDependentValue>)[path]

    if (!isDependentValue(next)) {
      if (currentDeps.length > 1)
        throw new Error(`invalidDeps at ${path}: ${currentDeps.join(', ')}`)

      current = next
      currentDeps = currentDeps.length === 1
        ? [{ path: `${currentDeps[0].path}.${path}` }]
        : []
    } else {
      if (next.deps == null && currentDeps.length > 0) throw new Error(`invalidDeps at ${path}: ${currentDeps.join(', ')}`)

      current = next.value
      currentDeps = next.deps ?? [{ path: `${currentDeps[0].path}.${path}` }]
      currentEmits = joinEmits(currentEmits, next.emits)
    }
  }

  return { value: current, deps: currentDeps, emits: currentEmits }
}

export const traverseObject = (
  obj: Record<string, unknown>,
  paths: (string | number)[]
): unknown => {
  let current: Record<string, unknown> | unknown = obj
  for (const path of paths) {
    if (current == null || typeof current !== 'object')
      throw new Error(`invalid parent "${prettifyObject(current)}" for ${path}`)

    const pathIsIncluded = path in current

    if (!pathIsIncluded)
      throw new Error(`pathNotFound "${path}"`)

    const next = (current as Record<string, unknown>)[path]

    current = next
  }

  return current
}

export const evaluateUnary = (
  utilities: tEvaluateUtilities,
): Record<tUnaryOperators, tEvaluateUnary> => ({
  isUndefinedOperator: async expression => {
    const isUndefinedExpression = expression as tIsUndefinedExpression
    const {
      value,
      ...emissions
    } = await utilities.innerEvaluate(isUndefinedExpression.args, utilities)

    if (value === undefined || value === null) return { value: true, ...emissions }
    return { value: false, ...emissions }
  },
  notOperator: async expression => {
    const notExpression = expression as tNotExpression
    const {
      value: args,
      ...emissions
    } = await utilities.innerEvaluate(notExpression.args, utilities)

    if (typeof args !== 'boolean') throw new Error('invalidBoolean')
    return { value: !args, ...emissions }
  },
  dotOperator: async expression => {
    const dotExpression = expression as tDotExpression
    let emits = getNewEmits()

    const value = await utilities.innerEvaluate(dotExpression.source, utilities)
    let paths: (string | number)[] = []

    if (isExpression(dotExpression.paths)) {
      const result = await utilities.innerEvaluate(dotExpression.paths, utilities)
      paths = result.value
      const convertedPathsDeps = convertDepsToEmits(result.deps)
      emits = joinEmits(emits, result.emits, convertedPathsDeps)
    } else {
      paths = dotExpression.paths
    }

    const pathsIsArray = Array.isArray(paths)
    const typesAreIncorrect = paths
      .some(current => typeof current !== 'string' && typeof current !== 'number')

    if (!pathsIsArray || typesAreIncorrect)
      throw new Error('invalidPaths')

    const result = traverseValue(value, paths)

    emits = joinEmits(emits, result.emits)

    return {
      value: result.value,
      deps: result.deps,
      emits,
    }
  },
  selfOperator: async expression => {
    const selfExpression = expression as tSelfExpression
    const pathsIsArray = Array.isArray(selfExpression.paths)
    try {
      const typesAreIncorrect = selfExpression.paths
        .some(current => typeof current !== 'string' && typeof current !== 'number')
      if (!pathsIsArray || typesAreIncorrect)
        throw new Error('invalidPaths')

      const self = utilities.scope.self
      if (self == null) throw new Error('selfNotFound')

      const traversedObject = traverseObject(self, selfExpression.paths) as tDependentValue['value']
      const newEmissions = getNewEmissions([{ path: `self.${selfExpression.paths.join('.')}` }])

      const result = {
        value: traversedObject,
        ...newEmissions,
      }

      return result
    } catch (e) {
      utilities.addTempEmits(`self.${selfExpression.paths.join('.')}`)
      throw e
    }
  },
  symbolOperator: async expression => {
    const symbolExpression = expression as tSymbolExpression

    if (typeof symbolExpression.name !== 'string') throw new Error('symbolNameNotString')
    if (utilities.scope === undefined) throw new Error('undefinedScopeData')

    const isTempSymbol = utilities.lambdaArgs != null &&
      utilities.lambdaArgs.includes(symbolExpression.name)

    const value = utilities.scope[symbolExpression.name]

    if (isDependentValue(value))
      return value as tDependentValue

    const newDeps = isTempSymbol
      ? getNewDeps()
      : getNewDeps([{ path: symbolExpression.name }])

    return {
      value,
      deps: newDeps,
      emits: getNewEmits(),
    }
  },
  lambdaOperator: async expression => {
    const lambdaExpression = expression as tLambdaExpression
    const lambdaArgs = getLambdaArgs(lambdaExpression)

    const newUtilities = {
      ...utilities,
      lambdaArgs: [...(utilities.lambdaArgs ?? []), ...lambdaArgs],
    }

    const result = await utilities.innerEvaluate(lambdaExpression.body, newUtilities)

    return result
  },
  andOperator: async expression => {
    const andExpression = expression as tAndExpression

    let emits = getNewEmits()
    const deps = getNewDeps()

    for (const arg of andExpression.args) {
      const response = await utilities.innerEvaluate(arg, utilities)
      if (typeof response.value !== 'boolean') throw new Error('invalidBoolean')

      const convertedDeps = convertDepsToEmits(response.deps)
      emits = joinEmits(emits, response.emits, convertedDeps)

      if (response.value !== true) {
        const result = { value: false, deps, emits }
        return result
      }
    }

    const result = { value: true, deps, emits }
    return result
  },
  orOperator: async expression => {
    const orExpression = expression as tOrExpression

    let emits = getNewEmits()
    const deps = getNewDeps()

    for (const arg of orExpression.args) {
      const response = await utilities.innerEvaluate(arg, utilities)
      if (typeof response.value !== 'boolean') throw new Error('invalidBoolean')

      const convertedDeps = convertDepsToEmits(response.deps)
      emits = joinEmits(emits, response.emits, convertedDeps)

      if (response.value === true) {
        const result = { value: true, deps, emits }
        return result
      }
    }

    const result = { value: false, deps, emits }
    return result
  },
  ruleOperator: async expression => {
    const ruleExpression = expression as tRuleExpression

    const ifResult = await utilities.innerEvaluate(ruleExpression.condition, utilities)
    if (typeof ifResult.value !== 'boolean') throw new Error('invalidBoolean')

    const ifEmits = joinEmits(
      convertDepsToEmits(ifResult.deps),
      ifResult.emits,
    )

    if (ifResult.value !== true) return {
      value: undefined,
      deps: getNewDeps(),
      emits: joinEmits(ifEmits, convertDepsToEmits(ifResult.deps)),
    }

    const thenResult = await utilities.innerEvaluate(ruleExpression.then, utilities)

    return {
      value: thenResult.value,
      deps: thenResult.deps,
      emits: joinEmits(ifEmits, thenResult.emits),
    }
  },
  rulesOperator: async expression => {
    const ruleExpression = expression as tRulesExpression
    let emits = getNewEmits()

    for (const rule of ruleExpression.rules) {
      const result = await utilities.innerEvaluate(rule, utilities)

      if (result.value !== undefined) return {
        value: result.value,
        deps: result.deps,
        emits: joinEmits(emits, result.emits),
      }

      emits = joinEmits(emits, result.emits)
    }

    const elseResult = await utilities.innerEvaluate(ruleExpression.else, utilities)
    return {
      value: elseResult.value,
      deps: elseResult.deps,
      emits: joinEmits(emits, elseResult.emits),
    }
  },
  tryOperator: async expression => {
    const tryExpression = expression as tTryExpression

    try {
      const tryResult = await utilities.innerEvaluate(tryExpression.try, utilities)
      return tryResult
    } catch (e) {
      const catchResult = await utilities.innerEvaluate(tryExpression.catch, utilities)
      return catchResult
    }
  },
  errorOperator: async expression => {
    const errorExpression = expression as tErrorExpression
    throw new Error(utilities.getTranslation(errorExpression.message))
  },
  warningOperator: async expression => {
    const warningExpression = expression as tWarningExpression

    if (warningExpression.message == null) throw new Error('missingMessage')

    utilities.emitWarning(utilities.getTranslation(warningExpression.message))

    if (warningExpression.value == null) throw new Error('missingValue')

    const parsedValue = await utilities.innerEvaluate(warningExpression.value, utilities)
    return parsedValue
  },
})
