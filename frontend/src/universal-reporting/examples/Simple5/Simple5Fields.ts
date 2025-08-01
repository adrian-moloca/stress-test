import { tField } from '@smambu/lib.constants'
import { trueExpression } from '../utils'

export const simple5Fields: tField[] = [
  {
    id: 'field1Value',
    name: {
      en: 'Field 1',
      de: 'Feld 1',
    },
    definition: {
      type: { kind: 'string' },
      readable: trueExpression,
      writable: trueExpression,
      automaticValue: {
        expressionKind: 'literalUniqueId',
        value: 'uniqueId',
      },
      mergePolicies: {
        vertical: 'CHILD',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },
  {
    id: 'field2Value',
    name: {
      en: 'Field 2',
      de: 'Feld 2',
    },
    definition: {
      type: { kind: 'string' },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: {
        vertical: 'CHILD',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },
  {
    id: 'field2ValueOverrideChild',
    name: {
      en: 'Field 2 Override Child',
      de: 'Feld 2 Override Child',
    },
    definition: {
      type: { kind: 'string' },
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
    id: 'object',
    name: {
      en: 'Object',
      de: 'Objekt',
    },
    definition: {
      type: {
        kind: 'object',
        object: {
          field1ParentVertical: {
            readable: trueExpression,
            writable: trueExpression,
            type: { kind: 'string' },
            automaticValue: {
              expressionKind: 'literalString',
              value: 'AUTOMATIC - field1subfield',
            },
            mergePolicies: {
              vertical: 'PARENT',
              horizontal: 'OVERWRITE',
            },
          },
          field2ChildVertical: {
            readable: trueExpression,
            writable: trueExpression,
            type: { kind: 'string' },
            automaticValue: {
              expressionKind: 'selfOperator',
              paths: ['field2ValueOverrideChild'],
            },
            mergePolicies: {
              vertical: 'CHILD',
              horizontal: 'OVERWRITE',
            },
          },
          subObject: {
            writable: trueExpression,
            automaticValue: {
              expressionKind: 'literalObj',
              value: {
                innerField1: 'SUBOBJECT - AUTOMATIC - innerField1',
                innerField2: 'SUBOBJECT - AUTOMATIC - innerField2',
              }
            },
            mergePolicies: {
              vertical: 'PARENT',
              horizontal: 'OVERWRITE',
            },
            type: {
              kind: 'object',
              object: {
                innerField1: {
                  type: { kind: 'string' },
                  readable: trueExpression,
                  writable: trueExpression,
                  automaticValue: {
                    expressionKind: 'literalString',
                    value: 'AUTOMATIC - innerField1',
                  },
                  mergePolicies: {
                    vertical: 'PARENT',
                    horizontal: 'OVERWRITE',
                  },
                },
                innerField2: {
                  type: { kind: 'string' },
                  readable: trueExpression,
                  writable: trueExpression,
                  automaticValue: {
                    expressionKind: 'literalString',
                    value: 'AUTOMATIC - innerField2',
                  },
                  mergePolicies: {
                    vertical: 'PARENT',
                    horizontal: 'OVERWRITE',
                  },
                }
              }
            },
            readable: trueExpression,
          }
        },
      },
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
      readable: trueExpression,
      writable: trueExpression,
      automaticValue: {
        expressionKind: 'objectOfExpressions',
        value: {
          field1ParentVertical: {
            expressionKind: 'selfOperator',
            paths: ['field1Value'],
          },
          field2ChildVertical: {
            expressionKind: 'selfOperator',
            paths: ['field2Value'],
          },
          subObject: {
            expressionKind: 'literalObj',
            value: {
              innerField1: 'ROOT - AUTOMATIC - innerField1',
              innerField2: 'ROOT - AUTOMATIC - innerField2',
            }
          }
        },
      },
    },
    version: '1',
  },
]
