import { tFunctionInvocation } from '../functions'

export const arrayLengthSignature = {
  args: {
    sourceArray: {
      argType: {
        kind: 'list',
        itemType: { kind: 'any' }
      }
    }
  },
  returnType: {
    kind: 'number'
  }
}

export type tArrayLengthInvocationExpression = tFunctionInvocation<'arrayLength'>
