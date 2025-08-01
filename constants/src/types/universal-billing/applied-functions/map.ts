import { tFunctionInvocation } from '../functions'

export const mapSignature = {
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

export type tMapInvocationExpression = tFunctionInvocation<'map'>
