import { tViewItem } from '@smambu/lib.constants'
import { required, falseExpression, override, trueExpression } from '../utils'

export const simple3Representation: tViewItem[] = [
  {
    fieldId: 'debtorNumber',
    label: { en: 'Debtor Number' },
    description: { en: 'Debtor Number description' },
    override,
    required,
    hide: falseExpression,
    viewAs: { representationKind: 'string' },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'patientNumber',
    label: { en: 'Patient Number' },
    description: { en: 'Patient Number description' },
    override,
    required,
    hide: falseExpression,
    viewAs: { representationKind: 'string' },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'thirdPartyNumber',
    label: { en: 'Third Party Number' },
    description: { en: 'Third Party Number description' },
    viewAs: { representationKind: 'string' },
    override,
    required,
    hide: falseExpression,
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'simpleDropdown',
    label: { en: 'Simple Dropdown' },
    description: { en: 'Simple Dropdown description' },
    viewAs: {
      representationKind: 'enum',
      labelField: {
        expressionKind: 'functionInvocation',
        function: 'map',
        parameters: {
          sourceArray: {
            expressionKind: 'symbolOperator',
            name: 'options',
          },
          callback: {
            expressionKind: 'lambdaOperator',
            args: ['current'],
            body: {
              expressionKind: 'objectOfExpressions',
              value: {
                $value: {
                  expressionKind: 'symbolOperator',
                  name: 'current',
                },
                $label: {
                  expressionKind: 'symbolOperator',
                  name: 'current',
                },
              },
            },
          },
        },
        typeHint: {
          kind: 'list',
          itemType: {
            type: { kind: 'string' },
            mergePolicies: {
              horizontal: 'OVERWRITE',
              vertical: 'PARENT',
            },
            readable: trueExpression,
            writable: trueExpression,
          },
        },
      },
    },
    override,
    required,
    hide: falseExpression,
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'simpleObjectDropdown',
    label: { en: 'Simple Object Dropdown' },
    description: { en: 'Simple Object Dropdown description' },
    viewAs: {
      representationKind: 'enum',
      labelField: {
        expressionKind: 'functionInvocation',
        function: 'map',
        parameters: {
          sourceArray: {
            expressionKind: 'symbolOperator',
            name: 'options',
          },
          callback: {
            expressionKind: 'lambdaOperator',
            args: ['current'],
            body: {
              expressionKind: 'objectOfExpressions',
              value: {
                $value: {
                  expressionKind: 'symbolOperator',
                  name: 'current'
                },
                $label: {
                  expressionKind: 'functionInvocation',
                  function: 'concat',
                  parameters: {
                    stringsToConcat: {
                      expressionKind: 'literalListOfExpressions',
                      value: [
                        {
                          expressionKind: 'dotOperator',
                          paths: ['id'],
                          source: {
                            expressionKind: 'symbolOperator',
                            name: 'current',
                          },
                        },
                        {
                          expressionKind: 'literalString',
                          value: ' - ',
                        },
                        {
                          expressionKind: 'dotOperator',
                          paths: ['value'],
                          source: {
                            expressionKind: 'symbolOperator',
                            name: 'current',
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        typeHint: {
          kind: 'list',
          itemType: {
            type: {
              kind: 'object',
              object: {
                $label: {
                  type: { kind: 'string' },
                  mergePolicies: {
                    horizontal: 'OVERWRITE',
                    vertical: 'PARENT',
                  },
                  readable: trueExpression,
                  writable: trueExpression,
                },
                id: {
                  type: { kind: 'string' },
                  mergePolicies: {
                    horizontal: 'OVERWRITE',
                    vertical: 'PARENT',
                  },
                  readable: trueExpression,
                  writable: trueExpression,
                },
              },
            },
            mergePolicies: {
              horizontal: 'OVERWRITE',
              vertical: 'PARENT',
            },
            readable: trueExpression,
            writable: trueExpression,
          },
        },
      },
    },
    override,
    required,
    hide: falseExpression,
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'thirdPartyNumber2',
    label: { en: 'Third Party Number 2' },
    description: { en: 'Third Party Number 2 description' },
    viewAs: { representationKind: 'string' },
    override,
    required,
    hide: falseExpression,
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'object',
    label: { en: 'Object' },
    description: { en: 'Object description' },
    viewAs: {
      representationKind: 'object',
      subFields: [
        {
          fieldId: 'cheneso',
          label: { en: 'Chens' },
          description: { en: 'Chens description' },
          viewAs: { representationKind: 'string' },
          override,
          required,
          hide: falseExpression,
          span: 12,
          margin: 0,
        },
      ],
    },
    override,
    required,
    hide: falseExpression,
    span: 12,
    margin: 0,
  },
]
