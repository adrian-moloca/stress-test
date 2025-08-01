import { tField } from '@smambu/lib.constants'
import { falseExpression, trueExpression } from '../utils'

export const simple4Fields: tField[] = [
  {
    id: 'table',
    name: {
      en: 'Table',
      de: 'Tabelle',
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
                writable: falseExpression,
                type: { kind: 'string' },
                mergePolicies: {
                  vertical: 'PARENT',
                  horizontal: 'OVERWRITE',
                },
              },
              name: {
                readable: trueExpression,
                writable: trueExpression,
                type: { kind: 'number' },
                mergePolicies: {
                  vertical: 'PARENT',
                  horizontal: 'OVERWRITE',
                },
              },
              age: {
                readable: trueExpression,
                writable: trueExpression,
                type: { kind: 'number' },
                mergePolicies: {
                  vertical: 'PARENT',
                  horizontal: 'OVERWRITE',
                },
              },
              innerObject: {
                readable: trueExpression,
                writable: trueExpression,
                type: {
                  kind: 'object',
                  object: {
                    innerId: {
                      readable: trueExpression,
                      writable: trueExpression,
                      type: { kind: 'string' },
                      mergePolicies: {
                        vertical: 'PARENT',
                        horizontal: 'OVERWRITE',
                      },
                    },
                    innerName: {
                      readable: trueExpression,
                      writable: trueExpression,
                      type: { kind: 'string' },
                      mergePolicies: {
                        vertical: 'PARENT',
                        horizontal: 'OVERWRITE',
                      },
                    },
                    innerAge: {
                      readable: trueExpression,
                      writable: trueExpression,
                      type: { kind: 'number' },
                      mergePolicies: {
                        vertical: 'PARENT',
                        horizontal: 'OVERWRITE',
                      },
                    },
                  }
                },
                mergePolicies: {
                  vertical: 'PARENT',
                  horizontal: 'OVERWRITE',
                },
              },
              innerStringList: {
                readable: trueExpression,
                writable: trueExpression,
                type: {
                  kind: 'list',
                  itemType: { type: { kind: 'string' }, readable: trueExpression, writable: trueExpression, mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' } },
                },
                mergePolicies: {
                  vertical: 'PARENT',
                  horizontal: 'OVERWRITE',
                },
              }
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
