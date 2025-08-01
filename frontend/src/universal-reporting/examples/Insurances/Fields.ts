import { tField } from '@smambu/lib.constants'

export const InsuranceFields: tField[] = [

  {
    id: 'dynamicFields',
    name: {
      en: 'Dynamic Fields',
      de: 'Dynamische Felder'
    },
    definition: {
      type: {
        kind: 'object',
        object: {
          insuranceStatus: {
            automaticValue: {
              expressionKind: 'literalString',
              value: 'NONE'
            },
            type: {
              kind: 'enum',
              options: {
                expressionKind: 'literalList',
                value: [
                  'PUBLIC',
                  'PRIVATE',
                  'NONE'
                ]
              }
            },
            readable: {
              expressionKind: 'literalBoolean',
              value: true,
              typeHint: {
                kind: 'boolean'
              }
            },
            writable: {
              expressionKind: 'literalBoolean',
              value: true,
              typeHint: {
                kind: 'boolean'
              }
            },
            mergePolicies: {
              vertical: 'CHILD',
              horizontal: 'SHY'
            }
          },
          insurance: {
            type: {
              kind: 'enum',
              options: {
                expressionKind: 'rulesOperator',
                rules: [
                  {
                    expressionKind: 'ruleOperator',
                    condition: {
                      expressionKind: 'equalsOperator',
                      left: {
                        expressionKind: 'selfOperator',
                        paths: [
                          'dynamicFields', 'insuranceStatus'
                        ]
                      },
                      right: {
                        expressionKind: 'literalString',
                        value: 'PUBLIC'
                      },
                      typeHint: {
                        kind: 'boolean'
                      }
                    },
                    then: {
                      expressionKind: 'literalList',
                      value: [
                        'foo',
                        'bar',
                        'baz',
                        'qux',
                        'lol',
                        'omg'
                      ]
                    }
                  },
                  {
                    expressionKind: 'ruleOperator',
                    condition: {
                      expressionKind: 'equalsOperator',
                      left: {
                        expressionKind: 'selfOperator',
                        paths: [
                          'dynamicFields', 'insuranceStatus'
                        ]
                      },
                      right: {
                        expressionKind: 'literalString',
                        value: 'PRIVATE'
                      },
                      typeHint: {
                        kind: 'boolean'
                      }
                    },
                    then: {
                      expressionKind: 'literalList',
                      value: [
                        'hello',
                        'world'
                      ]
                    }
                  }
                ],
                else: {
                  expressionKind: 'literalList',
                  value: []
                }
              }
            },
            readable: {
              expressionKind: 'literalBoolean',
              value: true,
              typeHint: {
                kind: 'boolean'
              }
            },
            writable: {
              expressionKind: 'literalBoolean',
              value: true,
              typeHint: {
                kind: 'boolean'
              }
            },
            mergePolicies: {
              vertical: 'PARENT',
              horizontal: 'OVERWRITE'
            }
          }
        }
      },
      readable: {
        expressionKind: 'literalBoolean',
        value: true,
        typeHint: {
          kind: 'boolean'
        }
      },
      writable: {
        expressionKind: 'literalBoolean',
        value: true,
        typeHint: {
          kind: 'boolean'
        }
      },
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE'
      }
    },
    version: '1'
  },
]
