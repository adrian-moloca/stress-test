import { tViewItem } from '@smambu/lib.constants'
import { falseExpression, trueExpression } from '../utils'

export const automaticTableRepresentation: tViewItem[] = [
  {
    fieldId: 'table',
    label: {
      en: 'Table'
    },
    description: {
      en: ''
    },
    override: trueExpression,
    required: trueExpression,
    hide: falseExpression,
    viewAs: {
      representationKind: 'table',
      columns: [
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'caseNumber',
          label: {
            en: 'Case number'
          },
          hide: falseExpression,
          viewAs: {
            representationKind: 'string'
          }
        },
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'surgeryName',
          label: {
            en: 'Surgery name'
          },
          viewAs: {
            representationKind: 'string'
          },
          hide: falseExpression,
        },
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'surgeryDate',
          label: {
            en: 'Surgery date'
          },
          viewAs: {
            representationKind: 'date',
            format: 'dd/MM/yyyy'
          },
          hide: falseExpression,
        },
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'doctorName',
          label: {
            en: 'Doctor name'
          },
          viewAs: {
            representationKind: 'string'
          },
          hide: falseExpression,
        },
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'patientName',
          label: {
            en: 'Patient name'
          },
          viewAs: {
            representationKind: 'string'
          },
          hide: falseExpression,
        },
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'recipiends',
          label: {
            en: 'Recipients'
          },
          viewAs: {
            representationKind: 'string'
          },
          hide: falseExpression,
        },
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'payImmediately',
          label: {
            en: 'Pay immediately'
          },
          viewAs: {
            representationKind: 'boolean'
          },
          hide: falseExpression,
        },
        {
          description: {
            en: ''
          },
          override: falseExpression,
          required: falseExpression,
          filterable: trueExpression,
          searchFullText: trueExpression,
          span: {
            flex: 1
          },
          fieldId: 'caseId',
          label: {
            en: ''
          },
          viewAs: {
            representationKind: 'string',
          },
          hide: falseExpression,
        }
      ],
      rowId: 'proxyId'
    },
    span: 12,
    margin: 0
  }
]
