import { tFunctionInvocation } from '../functions'

export const everySignature = {
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
    kind: 'number'
  }
}

export type tEveryInvocationExpression = tFunctionInvocation<'every'>
