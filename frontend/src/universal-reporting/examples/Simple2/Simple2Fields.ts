import { tField } from '@smambu/lib.constants'
import { trueExpression } from '../utils'

export const simple2Fields: tField[] = [
  {
    id: 'foostring',
    definition: {
      type: {
        kind: 'string',
      },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },

  {
    id: 'foonumber',
    definition: {
      type: { kind: 'number' },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },
  {
    id: 'foostringcatfoonumber',
    definition: {
      type: { kind: 'string' },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
      automaticValue: {
        expressionKind: 'functionInvocation',
        function: 'concat',
        parameters: {
          stringsToConcat: {
            expressionKind: 'literalListOfExpressions',
            value: [
              {
                expressionKind: 'selfOperator',
                paths: ['foostring'],
              },
              {
                expressionKind: 'literalString',
                value: '-',
              },
              {
                expressionKind: 'selfOperator',
                paths: ['foonumber'],
              },
            ],
          },
        },
      },
    },
    version: '1',
  },
  {
    id: 'foostringcatfoonumbercatfoonumber',
    definition: {
      type: { kind: 'string' },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
      automaticValue: {
        expressionKind: 'functionInvocation',
        function: 'concat',
        parameters: {
          stringsToConcat: {
            expressionKind: 'literalListOfExpressions',
            value: [
              {
                expressionKind: 'selfOperator',
                paths: ['foostringcatfoonumber'],
              },
              {
                expressionKind: 'literalString',
                value: '-',
              },
              {
                expressionKind: 'selfOperator',
                paths: ['foonumber'],
              },
            ],
          },
        },
      },
    },
    version: '1',
  },
]
