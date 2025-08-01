import { tFunctionInvocation } from '../functions'

export const objectValuesSignature = {
  args: {
    object: {
      argType: {
        kind: 'object',
        object: { kind: 'any' }
      }
    }
  },
  returnType: {
    kind: 'list',
    itemType: { kind: 'any' }
  }
}

export type tObjectValuesInvocationExpression = tFunctionInvocation<'objectValues'>
