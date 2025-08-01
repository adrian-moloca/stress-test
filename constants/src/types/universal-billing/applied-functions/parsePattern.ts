import { tFunctionInvocation } from '../functions'

export const parsePatternSignature = {
  args: {
    pattern: { kind: 'string' },
    forbiddenTokens: { kind: 'list', itemType: { kind: 'string' } },
  },
  returnType: {
    kind: 'list',
    itemType: { kind: 'any' }
  }
}

export type tParsePatternInvocationExpression = tFunctionInvocation<'parsePattern'>
