import { tField } from '@smambu/lib.constants'
import { trueExpression } from '../utils'

export const simple1Fields: tField[] = [
  {
    id: 'fooobject',
    definition: {
      type: {
        kind: 'object',
        object: {
          bar: {
            mergePolicies: {
              vertical: 'PARENT',
              horizontal: 'OVERWRITE',
            },
            readable: trueExpression,
            writable: trueExpression,
            type: {
              kind: 'object',
              object: {
                bar: {
                  type: { kind: 'number' },
                  readable: trueExpression,
                  writable: trueExpression,
                  mergePolicies: {
                    vertical: 'PARENT',
                    horizontal: 'OVERWRITE',
                  },
                },
                baz: {
                  type: {
                    kind: 'object',
                    object: {
                      mario: {
                        type: {
                          kind: 'enum',
                          options: {
                            expressionKind: 'functionInvocation',
                            function: 'map',
                            parameters: {
                              sourceArray: {
                                expressionKind: 'selfOperator',
                                paths: ['fooliststring'],
                              },
                              callback: {
                                expressionKind: 'lambdaOperator',
                                args: ['current'],
                                body: {
                                  expressionKind: 'objectOfExpressions',
                                  value: {
                                    id: {
                                      expressionKind: 'sumOperator',
                                      left: {
                                        expressionKind: 'literalNumber',
                                        value: 5,
                                      },
                                      right: {
                                        expressionKind: 'symbolOperator',
                                        name: 'current',
                                      },
                                    },
                                    value: {
                                      expressionKind: 'literalString',
                                      value: 'foo',
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        readable: trueExpression,
                        writable: trueExpression,
                        mergePolicies: {
                          vertical: 'PARENT',
                          horizontal: 'OVERWRITE',
                        },
                      },
                      marco: {
                        type: { kind: 'string' },
                        readable: trueExpression,
                        writable: trueExpression,
                        mergePolicies: {
                          vertical: 'PARENT',
                          horizontal: 'OVERWRITE',
                        },
                      },
                      franco: {
                        type: { kind: 'string' },
                        readable: trueExpression,
                        writable: trueExpression,
                        mergePolicies: {
                          vertical: 'PARENT',
                          horizontal: 'OVERWRITE',
                        },
                      },
                    },
                  },
                  readable: trueExpression,
                  writable: trueExpression,
                  mergePolicies: {
                    vertical: 'PARENT',
                    horizontal: 'OVERWRITE',
                  },
                },
              },
            },
          },
        },
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
    id: 'foostring',
    definition: {
      type: { kind: 'string' },
      readable: trueExpression,
      writable: trueExpression,
      automaticValue: {
        expressionKind: 'literalString',
        value: 'foostring',
      },
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
      automaticValue: {
        expressionKind: 'literalNumber',
        value: 1,
      },
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },
  {
    id: 'fooliststring',
    definition: {
      type: {
        kind: 'list',
        itemType: {
          type: { kind: 'string' },
          readable: trueExpression,
          writable: trueExpression,
          mergePolicies: {
            vertical: 'PARENT',
            horizontal: 'OVERWRITE',
          },
        },
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
    id: 'fooenum',
    definition: {
      type: {
        kind: 'enum',
        options: {
          expressionKind: 'literalListOfExpressions',
          typeHint: {
            kind: 'list',
            itemType: {
              type: { kind: 'string' },
              readable: trueExpression,
              writable: trueExpression,
              mergePolicies: {
                vertical: 'PARENT',
                horizontal: 'OVERWRITE',
              },
            },
          },
          value: [
            {
              expressionKind: 'objectOfExpressions',
              value: {
                id: {
                  expressionKind: 'literalString',
                  value: '1',
                },
                value: {
                  expressionKind: 'literalString',
                  value: 'value1',
                },
              },
            },
            {
              expressionKind: 'objectOfExpressions',
              value: {
                id: {
                  expressionKind: 'literalString',
                  value: '2',
                },
                value: {
                  expressionKind: 'literalString',
                  value: 'value2',
                },
              },
            },
          ],
        },
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
]
