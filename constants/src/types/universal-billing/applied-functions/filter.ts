import { tFunctionInvocation } from '../functions'

export const filterSignature = {
  args: {
    sourceArray: {
      argType: {
        kind: 'list',
        itemType: { kind: 'any' }
      }
    },
    callback: { kind: 'function' }
  },
  returnType: {
    kind: 'list',
    itemType: { kind: 'any' }
  }
}

export type tFilterInvocationExpression = tFunctionInvocation<'filter'>
