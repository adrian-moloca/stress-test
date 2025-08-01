import { tFunctionInvocation } from '../functions'

export const concatArraySignature = {
  args: {
    arraysToConcat: {
      argType: {
        kind: 'list',
        itemType: { kind: 'array' }
      },
    }
  },
  returnType: { kind: 'array' }
} as const

export type tConcatArrayInvocationExpression = tFunctionInvocation<'concatArray'>
