import { tField } from '@smambu/lib.constants'
import { trueExpression } from '../utils'

export const simpleListFields: tField[] = [
  {
    id: 'list',
    name: {
      en: 'List',
      de: 'List',
    },
    definition: {
      type: {
        kind: 'list',
        itemType: {
          type: { kind: 'string' },
          readable: trueExpression,
          writable: trueExpression,
          mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
        },
      },
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
    id: 'listObject',
    name: {
      en: 'List Object',
      de: 'List Object',
    },
    definition: {
      type: {
        kind: 'list',
        itemType: {
          type: {
            kind: 'object',
            object: {
              field1: {
                type: { kind: 'string' },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
              },
              field2: {
                type: { kind: 'string' },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
              },
            },
          },
          readable: trueExpression,
          writable: trueExpression,
          mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
        },
      },
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
    id: 'table',
    name: {
      en: 'Table',
      de: 'Table',
    },
    definition: {
      automaticValue: {
        expressionKind: 'literalList',
        value: [
          {
            subList1: [
              {
                subList1field1: 'ROOT- AUTOMATIC - 1',
                subList1field2: 'ROOT- AUTOMATIC - 2',
              },
            ],
            subList2: [
              {
                subList2field1: 'ROOT- AUTOMATIC - 3',
                subList2field2: 'ROOT- AUTOMATIC - 4',
              },
            ],
          },
          {
            subList1: [
              {
                subList1field1: 'ROOT- AUTOMATIC - 1',
                subList1field2: 'ROOT- AUTOMATIC - 2',
              },
            ],
            subList2: [
              {
                subList2field1: 'ROOT- AUTOMATIC - 3',
                subList2field2: 'ROOT- AUTOMATIC - 4',
              },
            ],
          },
        ],
      },
      type: {
        kind: 'list',
        itemType: {
          type: {
            kind: 'object',
            object: {
              subList1: {
                automaticValue: {
                  expressionKind: 'literalObj',
                  value: {
                    subList1field1: 'subList1field1 - AUTOMATIC -1',
                    subList1field2: 'subList1field2 - AUTOMATIC -2',
                  },
                },
                type: {
                  kind: 'list',
                  itemType: {
                    type: {
                      kind: 'object',
                      object: {
                        subList1field1: {
                          type: { kind: 'string' },
                          automaticValue: {
                            expressionKind: 'literalString',
                            value: 'AUTOMATIC SUBLISTFIELD1',
                          },
                          readable: trueExpression,
                          writable: trueExpression,
                          mergePolicies: {
                            vertical: 'CHILD',
                            horizontal: 'OVERWRITE',
                          },
                        },
                        subList1field2: {
                          type: { kind: 'string' },
                          automaticValue: {
                            expressionKind: 'literalString',
                            value: 'AUTOMATIC SUBLISTFIELD2',
                          },
                          readable: trueExpression,
                          writable: trueExpression,
                          mergePolicies: {
                            vertical: 'CHILD',
                            horizontal: 'OVERWRITE',
                          },
                        },
                      },
                    },
                    readable: trueExpression,
                    writable: trueExpression,
                    mergePolicies: {
                      vertical: 'CHILD',
                      horizontal: 'OVERWRITE',
                    },
                  },
                },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
              },
              subList2: {
                type: {
                  kind: 'list',
                  itemType: {
                    type: {
                      kind: 'object',
                      object: {
                        subList2field1: {
                          type: { kind: 'string' },
                          readable: trueExpression,
                          writable: trueExpression,
                          mergePolicies: {
                            vertical: 'CHILD',
                            horizontal: 'OVERWRITE',
                          },
                        },
                      },
                    },
                    readable: trueExpression,
                    writable: trueExpression,
                    mergePolicies: {
                      vertical: 'CHILD',
                      horizontal: 'OVERWRITE',
                    },
                  },
                },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
              },
            },
          },
          readable: trueExpression,
          writable: trueExpression,
          mergePolicies: { vertical: 'CHILD', horizontal: 'OVERWRITE' },
        },
      },
      readable: trueExpression,
      writable: trueExpression,
      mergePolicies: {
        vertical: 'CHILD',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },
]
