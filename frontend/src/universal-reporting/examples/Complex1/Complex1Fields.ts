import { tField } from '@smambu/lib.constants'
import { trueExpression } from '../utils'

export const complex1Fields: tField[] = [
  {
    id: 'myString',
    version: '1',
    definition: {
      automaticValue: {
        expressionKind: 'literalString',
        value: 'mondo',
      },
      type: { kind: 'string' },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
    },
  },
  {
    id: 'myObject',
    version: '1',
    definition: {
      type: {
        kind: 'object',
        object: {
          fieldA: {
            type: { kind: 'string' },
            readable: trueExpression,
            writable: trueExpression,
            mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
          },
          fieldB: {
            type: { kind: 'number' },
            readable: trueExpression,
            writable: trueExpression,
            mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
          },
        },
      },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
    },
  },
  {
    id: 'myObjectList',
    version: '1',
    definition: {
      automaticValue: {
        expressionKind: 'literalList',
        value: [{}, {}]
      },
      type: {
        kind: 'list',
        itemType: {
          type: {
            kind: 'object',
            object: {
              pippo: {
                type: { kind: 'string' },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
                automaticValue: {
                  expressionKind: 'literalString',
                  value: 'ciao',
                },
              },
              pluto: {
                type: { kind: 'string' },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
                automaticValue: {
                  expressionKind: 'functionInvocation',
                  function: 'concat',
                  parameters: {
                    stringsToConcat: {
                      expressionKind: 'literalListOfExpressions',
                      value: [
                        {
                          expressionKind: 'selfOperator',
                          paths: ['myString'],
                        },
                        {
                          expressionKind: 'literalString',
                          value: 'pippo',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          readable: trueExpression,
          writable: trueExpression,
          mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
        },
      },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
    },
  },
]
