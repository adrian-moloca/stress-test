import { tFunctionInvocation } from '../functions'

type UniqueArgs = {
  arrayToUnique: {
    argType: {
      kind: 'list',
      itemType: { kind: 'array' }
    },
  },
  getKey?: { kind: 'function' }
}

export const uniqueSignature = {
  args: {
    arrayToUnique: {
      argType: {
        kind: 'list',
        itemType: { kind: 'array' }
      },
    },
    getKey: { kind: 'function' }
  } as UniqueArgs,
  returnType: { kind: 'array' }
} as const

export type tUniqueInvocationExpression = tFunctionInvocation<'unique'>
