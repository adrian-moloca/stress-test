import { tField } from '@smambu/lib.constants'
import { trueExpression } from '../utils'

export const vatValuesFields: tField[] = [
  {
    id: 'vatValues',
    name: {
      en: 'VAT Values',
      de: 'Mehrwertsteuersätze'
    },
    definition: {
      type: {
        kind: 'list',
        itemType: {
          type: {
            kind: 'object',
            object: {
              id: {
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: {
                  vertical: 'CHILD',
                  horizontal: 'SHY'
                },
                automaticValue: {
                  expressionKind: 'literalUniqueId',
                  value: '{uniqueId}'
                },
                type: {
                  kind: 'uniqueId'
                }
              },
              fullPercentage: {
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: {
                  vertical: 'CHILD',
                  horizontal: 'SHY'
                },
                type: {
                  kind: 'positiveNumber'
                }
              },
              halfPercentage: {
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: {
                  vertical: 'CHILD',
                  horizontal: 'SHY'
                },
                type: {
                  kind: 'positiveNumber'
                }
              },
              validFrom: {
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: {
                  vertical: 'CHILD',
                  horizontal: 'SHY'
                },
                type: {
                  kind: 'date'
                }
              }
            }
          },
          readable: trueExpression,
          writable: trueExpression,
          mergePolicies: {
            vertical: 'CHILD',
            horizontal: 'SHY'
          },
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
      },
    },
    version: '1'
  }
]
