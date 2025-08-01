import { tField } from '@smambu/lib.constants'
import { trueExpression } from '../utils'

export const simple3Fields: tField[] = [
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
          cheneso: {
            type: { kind: 'string' },
            readable: trueExpression,
            writable: trueExpression,
            automaticValue: {
              expressionKind: 'functionInvocation',
              function: 'concat',
              parameters: {
                stringsToConcat: {
                  expressionKind: 'literalListOfExpressions',
                  value: [
                    {
                      expressionKind: 'selfOperator',
                      paths: ['debtorNumber'],
                    },
                    {
                      expressionKind: 'literalString',
                      value: '-',
                    },
                    {
                      expressionKind: 'selfOperator',
                      paths: ['thirdPartyNumber2'],
                    },
                  ],
                },
              },
            },
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
    version: '1',
  },
  {
    id: 'debtorNumber',
    name: {
      en: 'Debtor Number',
      de: 'Schuldner Nummer',
    },
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
    id: 'patientNumber',
    name: {
      en: 'Patient Number',
      de: 'Patient Nummer',
    },
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
    id: 'thirdPartyNumber',
    name: {
      en: 'Third Party Number',
      de: 'Dritte Partei Nummer',
    },
    definition: {
      type: {
        kind: 'string',
      },
      readable: trueExpression,
      writable: trueExpression,
      automaticValue: {
        expressionKind: 'functionInvocation',
        function: 'concat',
        parameters: {
          stringsToConcat: {
            expressionKind: 'literalListOfExpressions',
            value: [
              {
                expressionKind: 'selfOperator',
                paths: ['debtorNumber'],
              },
              {
                expressionKind: 'literalString',
                value: '-',
              },
              {
                expressionKind: 'selfOperator',
                paths: ['patientNumber'],
              },
            ],
          },
        },
      },
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },
  {
    id: 'thirdPartyNumber2',
    name: {
      en: 'Third Party Number',
      de: 'Dritte Partei Nummer',
    },
    definition: {
      type: {
        kind: 'string',
      },
      readable: trueExpression,
      writable: trueExpression,
      automaticValue: {
        expressionKind: 'functionInvocation',
        function: 'concat',
        parameters: {
          stringsToConcat: {
            expressionKind: 'literalListOfExpressions',
            value: [
              {
                expressionKind: 'selfOperator',
                paths: ['debtorNumber'],
              },
              {
                expressionKind: 'literalString',
                value: '-',
              },
              {
                expressionKind: 'selfOperator',
                paths: ['thirdPartyNumber'],
              },
            ],
          },
        },
      },
      mergePolicies: {
        vertical: 'PARENT',
        horizontal: 'OVERWRITE',
      },
    },
    version: '1',
  },
  {
    id: 'bgNumber',
    name: {
      en: 'BG Number',
      de: 'BG Nummer',
    },
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
    id: 'simpleDropdown',
    name: {
      en: 'Simple Dropdown',
      de: 'Einfache Dropdown',
    },
    definition: {
      type: {
        kind: 'enum',
        options: {
          expressionKind: 'literalList',
          // @ts-ignore
          value: ['value1', 'value2', 'value3'],
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
    id: 'simpleObjectDropdown',
    name: {
      en: 'Simple Object Dropdown',
      de: 'Einfache Objekt Dropdown',
    },
    definition: {
      type: {
        kind: 'enum',
        options: {
          expressionKind: 'literalList',
          value: [
            {
              // @ts-ignore
              id: '1',
              value: 'value1',
            },
            {
              // @ts-ignore
              id: '2',
              value: 'value2',
            },
            {
              // @ts-ignore
              id: '3',
              value: 'value3',
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
