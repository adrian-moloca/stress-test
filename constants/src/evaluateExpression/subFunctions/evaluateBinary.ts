import { tBinaryExpression, tBinaryOperators, tEvaluateBinary, tEvaluateUtilities } from '../../types'
import { isEqual } from 'lodash'
import { getValue, joinDeps, joinEmits } from './dependenciesFunctions'

export const evaluateBinary = (
  utilities: tEvaluateUtilities
): Record<tBinaryOperators, tEvaluateBinary> => {
  const evaluateNumber = (data: unknown): number => {
    if (typeof data !== 'number') throw new Error('invalidNumber')
    return data
  }

  const evaluateString = (data: unknown): string => {
    if (typeof data !== 'string') throw new Error('invalidString')
    return data
  }

  const evaluateArray = (data: unknown): unknown[] => {
    if (!Array.isArray(data)) throw new Error('invalidArray')
    return data
  }

  const evaluateValues = async (data: tBinaryExpression) => {
    const left = await utilities.innerEvaluate(data.left, utilities)
    const right = await utilities.innerEvaluate(data.right, utilities)

    const newDeps = joinDeps(left.deps, right.deps)
    const newEmits = joinEmits(left.emits, right.emits)

    return {
      left: left.value,
      right: right.value,
      deps: newDeps,
      emits: newEmits,
    }
  }

  return {
    equalsOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: isEqual(left, right),
        ...emissions,
      }

      return result
    },
    notEqualsOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: !isEqual(left, right),
        ...emissions,
      }

      return result
    },
    greaterThanOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) > evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    lessThanOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) < evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    greaterOrEqualsThanOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) >= evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    lessOrEqualsOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) <= evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    sumOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) + evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    differenceOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) - evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    productOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) * evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    divisionOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateNumber(left) / evaluateNumber(right),
        ...emissions,
      }

      return result
    },
    containsStringOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateString(left).includes(evaluateString(right)),
        ...emissions,
      }

      return result
    },
    startsWithOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateString(left).startsWith(evaluateString(right)),
        ...emissions,
      }

      return result
    },
    endsWithOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)

      const result = {
        value: evaluateString(left).endsWith(evaluateString(right)),
        ...emissions,
      }

      return result
    },
    includesOperator: async expression => {
      const { left, right, ...emissions } = await evaluateValues(expression)
      const evaluatedLeft = evaluateArray(left)

      for (let el of evaluatedLeft) {
        const response = isEqual(getValue(el), getValue(right))

        if (response) {
          const result = {
            value: true,
            ...emissions,
          }

          return result
        }
      }

      const result = {
        value: false,
        ...emissions,
      }

      return result
    }
  }
}
