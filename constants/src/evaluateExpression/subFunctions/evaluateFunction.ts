import { tConcatInvocationExpression, tEvaluateFunction, tEvaluateUtilities, tDependentValue, tFilterInvocationExpression, tMapInvocationExpression, tSupportedFunctionsNames, tArrayLengthInvocationExpression, tConcatArrayInvocationExpression, tUniqueInvocationExpression, tEveryInvocationExpression, tObjectValuesInvocationExpression } from '../../types'
import { getLambdaArgs } from './evaluateUnary'
import { convertDepsToEmits, getNewDeps, isDependentValue, joinDeps, joinEmits, getNewEmits } from './dependenciesFunctions'
import { stackStrings } from './optionals'
import { tParsePatternInvocationExpression } from '../../types/universal-billing/applied-functions/parsePattern'
import { parsePattern } from '../../invoicing'

/* Example of a function invocation: usersNames
  {
    value: [{value: 'John', deps: ['users.33.name'], emits: ['a'] }, {value: 'Doe', deps: ['users.34.name'], emits: ['b']}],
    deps: ['users'],
    emits: ['c'],
  }
*/

/* Example of a concat invocation: concat(usersNames)
  {value: 'JohnDoe', deps: ['users.33.name', 'users.34.name'], emits: ['users', 'c', 'a', 'b']}
*/

/* Example of a concatArray invocation: concatArray(usersA, usersC)
  args: {
    value: [
      {value: [userA, userB], deps: ['usersA'], emits: ['a'] },
      {value: [userC, userD], deps: ['usersC'], emits: ['b']}
    ],
    deps: [],
    emits: ['c']
  }
  result: {
    value: [userA, userB, userC, userD],
    deps: [],
    emits: ['usersA', 'usersC', 'a', 'b', 'c']
  }
*/

/* Example of a unique invocation: unique(usersA, usersC)
  args: {
    value: [userA, userB, userC, userD], deps: ['users'], emits: ['a'] ,
  }
  result: {
    value: [userA, userB, userC, userD],
    deps: ['users'],
    emits: ['a']
  }
*/

/* Example of a filter invocation: userNames.filter(name => name === self.contract.name) // name: 'John'
  {
    value: [{value: 'John', deps: ['users.33.name'], emits: ['a', 'user.33.name', 'self.contract.name']}]
    deps: ['users'],
    emits: ['c', 'users.34.name', 'self.contract.name', 'b']
  }
*/

/* Example of a map invocation: userNames.map(name => name === self.contract.name)
  {
    value: [
      {value: true, deps: ['users.33.name', 'self.contract.name'], emits: ['a']},
      {value: false, deps: ['users.34.name', 'self.contract.name'], emits: ['b']}
    ]
    deps: ['users'],
    emits: ['c']
  }
*/

export const evaluateFunction = (
  utilities: tEvaluateUtilities
): Record<tSupportedFunctionsNames, tEvaluateFunction> => ({
  concat: async (expression): Promise<tDependentValue> => {
    const concatExpression = expression as tConcatInvocationExpression

    utilities.appendStack(stackStrings.stringsToConcat)

    const { value: args, deps, emits } = await utilities.innerEvaluate(
      concatExpression.parameters.stringsToConcat,
      utilities,
    )
    if (!Array.isArray(args) || args.every(arg => typeof arg.value !== 'string'))
      throw new Error('invalidArgs')

    utilities.popStack()

    const argsDeps = args.map(arg => arg.deps)
    const newDeps = joinDeps(...argsDeps, deps)
    const convertedDeps = convertDepsToEmits(newDeps)
    const argsEmits = args.map(arg => arg.emits)
    const newEmits = joinEmits(convertedDeps, emits, ...argsEmits)
    const newValues = args.map(arg => arg.value).join('')

    return {
      value: newValues,
      deps: newDeps,
      emits: newEmits,
    }
  },
  concatArray: async (expression): Promise<tDependentValue> => {
    const concatExpression = expression as tConcatArrayInvocationExpression

    utilities.appendStack(stackStrings.arraysToConcat)

    const { value: args, deps, emits } = await utilities.innerEvaluate(
      concatExpression.parameters.arraysToConcat,
      utilities,
    )

    const isArrayArgs = Array.isArray(args)
    const ArgsIsArrayAndEveryArgIsArray = isArrayArgs && args.every(arg => Array.isArray(arg.value))

    if (!ArgsIsArrayAndEveryArgIsArray)
      throw new Error('invalidArgs')

    utilities.popStack()

    const newArgsDeps = joinDeps(...args.map((arg: tDependentValue) => arg.deps))
    const newArgsEmits = joinEmits(...args.map((arg: tDependentValue) => arg.emits))
    const convertedDeps = convertDepsToEmits(newArgsDeps)
    const convertedEmits = convertDepsToEmits(deps)

    const newEmits = joinEmits(convertedDeps, convertedEmits, emits, newArgsEmits)
    const newValues = args.reduce((acc: unknown[], arg: tDependentValue) =>
      [...acc, ...arg.value], [])

    return {
      value: newValues,
      deps: getNewDeps(),
      emits: newEmits,
    }
  },
  unique: async (expression): Promise<tDependentValue> => {
    const uniqueExpression = expression as tUniqueInvocationExpression

    utilities.appendStack(stackStrings.arrayToUnique)

    const { value: args, deps, emits } = await utilities.innerEvaluate(
      uniqueExpression.parameters.arrayToUnique,
      utilities,
    )

    if (!Array.isArray(args)) throw new Error('invalidArgs')

    utilities.popStack()

    const keyValues: unknown[] = []
    const newValues: unknown[] = []
    let newEmits = [...emits]

    for (let i = 0; i < args.length; i++) {
      utilities.appendStack(stackStrings.uniqueIndex(i))
      const arg = args[i]
      const argValue = isDependentValue(arg) ? arg.value : arg

      let result: tDependentValue

      if (uniqueExpression.parameters.getKey != null) {
        const getKey = uniqueExpression.parameters.getKey
        const [argName] = getLambdaArgs(getKey, 1)
        const newScope = { ...utilities.scope, [argName]: argValue }

        result = await utilities.innerEvaluate(getKey, { ...utilities, scope: newScope })
      } else {
        result = { value: argValue, deps: getNewDeps(), emits: getNewEmits() }
      }

      if (!keyValues.includes(result.value)) {
        keyValues.push(result.value)
        newValues.push(arg)
      }

      const convertedDeps = convertDepsToEmits(result.deps)

      newEmits = joinEmits(newEmits, result.emits, convertedDeps)
    }

    return {
      value: newValues,
      deps,
      emits: newEmits,
    }
  },
  filter: async (expression): Promise<tDependentValue> => {
    const filterExpression = expression as tFilterInvocationExpression
    utilities.appendStack(stackStrings.sourceArray)
    const { value: evaluatedArray, deps, emits } =
      await utilities.innerEvaluate(filterExpression.parameters.sourceArray, utilities)

    let newEmits = [...emits]

    if (!Array.isArray(evaluatedArray)) throw new Error('invalidArgs')
    utilities.popStack()

    const results = []
    const [argName] = getLambdaArgs(filterExpression.parameters.callback, 1)

    for (let i = 0; i < evaluatedArray.length; i++) {
      utilities.appendStack(stackStrings.filterIndex(i))

      const newScope = { ...utilities.scope, [argName]: evaluatedArray[i] }
      const result = await utilities.innerEvaluate(
        filterExpression.parameters.callback,
        {
          ...utilities,
          scope: newScope,
        }
      )

      if (typeof result.value !== 'boolean') throw new Error('invalidResult')
      if (result.value)
        results.push(evaluatedArray[i])

      const convertedDeps = convertDepsToEmits(result.deps)
      newEmits = joinEmits(newEmits, result.emits, convertedDeps)

      utilities.popStack()
    }

    return { value: results, deps, emits: newEmits }
  },
  map: async (expression): Promise<tDependentValue> => {
    const mapExpression = expression as tMapInvocationExpression
    utilities.appendStack(stackStrings.sourceArray)
    const { value: evaluatedArray, ...emissions } =
      await utilities.innerEvaluate(mapExpression.parameters.sourceArray, utilities)

    if (!Array.isArray(evaluatedArray))
      throw new Error('invalidEvaluatedArray')

    utilities.popStack()

    const results = []
    const [argName] = getLambdaArgs(mapExpression.parameters.callback, 1)
    for (let i = 0; i < evaluatedArray.length; i++) {
      utilities.appendStack(stackStrings.mapIndex(i))
      const newScope = { ...utilities.scope, [argName]: evaluatedArray[i] }

      const result = await utilities.innerEvaluate(
        mapExpression.parameters.callback,
        {
          ...utilities,
          scope: newScope,
        }
      )
      results[i] = result
      utilities.popStack()
    }

    return { value: results, ...emissions }
  },
  parsePattern: async (expression): Promise<tDependentValue> => {
    const parsePatternExpression = expression as tParsePatternInvocationExpression

    const { value: pattern, deps, emits } =
      await utilities.innerEvaluate(parsePatternExpression.parameters.pattern, utilities)

    if (typeof pattern !== 'string') throw new Error('invalidPattern')

    const { value: forbiddenTokens, deps: forbiddenTokensDeps, emits: forbiddenTokensEmits } =
      await utilities.innerEvaluate(parsePatternExpression.parameters.forbiddenTokens, utilities)

    if (!Array.isArray(forbiddenTokens)) throw new Error('invalidForbiddenTokens')

    const forbiddenTokensArray = forbiddenTokens.map(token => {
      if (isDependentValue(token))
        return token.value

      return token
    })
    if (forbiddenTokensArray.some(token => typeof token !== 'string')) throw new Error('invalidForbiddenTokens')

    const [, errors] = parsePattern(pattern, forbiddenTokensArray)

    if (errors != null && errors.length > 0) throw new Error(errors[0].error_code)

    const newDeps = joinDeps(deps, forbiddenTokensDeps)
    const newEmits = joinEmits(emits, forbiddenTokensEmits)
    const convertedDeps = convertDepsToEmits(newDeps)
    const joinedEmits = joinEmits(newEmits, convertedDeps)

    return {
      value: true,
      deps: getNewDeps(),
      emits: joinedEmits,
    }
  },
  arrayLength: async (expression): Promise<tDependentValue> => {
    const arrayLengthExpression = expression as tArrayLengthInvocationExpression

    const { value: evaluatedArray, deps, emits } =
      await utilities.innerEvaluate(arrayLengthExpression.parameters.sourceArray, utilities)

    if (!Array.isArray(evaluatedArray)) throw new Error('invalidEvaluatedArray')

    const convertedDeps = convertDepsToEmits(deps)
    const joinedEmits = joinEmits(emits, convertedDeps)

    return {
      value: evaluatedArray.length,
      deps: getNewDeps(convertedDeps),
      emits: joinedEmits,
    }
  },
  every: async (expression): Promise<tDependentValue> => {
    const everyExpression = expression as tEveryInvocationExpression
    let newEmits = getNewEmits()

    const { value: evaluatedArray, deps: evaluatedArrayDeps, emits: evaluatedArrayEmits } =
      await utilities.innerEvaluate(everyExpression.parameters.sourceArray, utilities)

    if (!Array.isArray(evaluatedArray)) throw new Error('invalidEvaluatedArray')

    const convertedEvaluatedArrayDeps = convertDepsToEmits(evaluatedArrayDeps)
    newEmits = joinEmits(evaluatedArrayEmits, newEmits, convertedEvaluatedArrayDeps)

    const [argName] = getLambdaArgs(everyExpression.parameters.callback, 1)

    for (let i = 0; i < evaluatedArray.length; i++) {
      utilities.appendStack(stackStrings.everyIndex(i))

      const newScope = { ...utilities.scope, [argName]: evaluatedArray[i] }
      const result = await utilities.innerEvaluate(
        everyExpression.parameters.callback,
        {
          ...utilities,
          scope: newScope,
        }
      )

      if (typeof result.value !== 'boolean') throw new Error('invalidResult')

      const convertedDeps = convertDepsToEmits(result.deps)
      newEmits = joinEmits(newEmits, result.emits, convertedDeps)

      if (result.value === false)
        return {
          value: false,
          deps: getNewDeps(),
          emits: newEmits,
        }

      utilities.popStack()
    }

    return {
      value: true,
      deps: getNewDeps(),
      emits: newEmits,
    }
  },
  objectValues: async (expression): Promise<tDependentValue> => {
    const objectValuesExpression = expression as tObjectValuesInvocationExpression

    const { value: object, deps, emits } =
      await utilities.innerEvaluate(objectValuesExpression.parameters.object, utilities)

    if (typeof object !== 'object') throw new Error('invalidObject')

    const values = Object.values(object)

    return {
      value: values,
      deps,
      emits,
    }
  }
})
