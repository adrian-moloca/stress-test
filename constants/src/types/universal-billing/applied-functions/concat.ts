import { tFunctionInvocation } from '../functions'

export const concatSignature = {
  args: {
    stringsToConcat: {
      argType: {
        kind: 'list',
        itemType: { kind: 'string' }
      },
    }
  },
  returnType: { kind: 'string' }
} as const

export type tConcatInvocationExpression = tFunctionInvocation<'concat'>
