import { tViewItem } from '@smambu/lib.constants'
import { required, falseExpression, override, trueExpression } from '../utils'

export const simple4Representation: tViewItem[] = [
  {
    fieldId: 'table',
    label: { en: 'Table' },
    description: { en: 'Table description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'table',
      columns: [{
        fieldId: 'id',
        label: { en: 'ID' },
        description: { en: 'ID description' },
        override,
        required,
        filterable: trueExpression,
        searchFullText: trueExpression,
        span: { flex: 1 },
        hide: falseExpression,
        viewAs: { representationKind: 'string' },
      }, {
        fieldId: 'name',
        label: { en: 'Name' },
        description: { en: 'Name description' },
        override,
        required,
        filterable: falseExpression,
        searchFullText: trueExpression,
        span: { flex: 1 },
        hide: falseExpression,
        viewAs: { representationKind: 'string' },
      }, {
        fieldId: 'innerObject',
        label: { en: 'Inner Object' },
        description: { en: 'Inner Object description' },
        override,
        required,
        filterable: falseExpression,
        searchFullText: trueExpression,
        span: { flex: 1 },
        hide: falseExpression,
        viewAs: {
          representationKind: 'object',
          subFields: [
            {
              fieldId: 'innerId',
              label: { en: 'Inner ID' },
              description: { en: 'Inner ID description' },
              override,
              required,
              viewAs: { representationKind: 'string' },
              hide: falseExpression,
              span: 12,
              margin: 0,
            }, {
              fieldId: 'innerName',
              label: { en: 'Inner Name' },
              description: { en: 'Inner Name description' },
              override,
              required,
              viewAs: { representationKind: 'string' },
              hide: falseExpression,
              span: 12,
              margin: 0,
            }
          ]
        },
      },
      {
        fieldId: 'innerStringList',
        label: { en: 'Inner String List' },
        description: { en: 'Inner String List description' },
        override,
        required,
        hide: falseExpression,
        filterable: falseExpression,
        searchFullText: trueExpression,
        span: { flex: 1 },
        viewAs: {
          representationKind: 'list',
          field: {
            fieldId: 'innerStringList',
            label: { en: 'Inner String List' },
            description: { en: 'Inner String List description' },
            override,
            required,
            viewAs: { representationKind: 'string' },
            hide: falseExpression,
            span: 12,
            margin: 0,
          }
        },
      }
      ],
      rowId: 'id'
    },
    span: 12,
    margin: 0,
  }
]
