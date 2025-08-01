import { tViewItem } from '@smambu/lib.constants'
import { required, falseExpression, override, trueExpression } from '../utils'

export const simpleListRepresentation: tViewItem[] = [
  {
    fieldId: 'list',
    label: { en: 'List' },
    description: { en: 'List description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'list',
      field: {
        fieldId: 'field1',
        label: { en: 'Field 1' },
        description: { en: 'Field 1 description' },
        viewAs: { representationKind: 'string' },
        hide: falseExpression,
        span: 12,
        margin: 0,
        override,
        required
      },
    },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'listObject',
    label: { en: 'List Object' },
    description: { en: 'List Object description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'list',
      field: {
        fieldId: 'field1',
        label: { en: 'Field 1' },
        description: { en: 'Field 1 description' },
        viewAs: {
          representationKind: 'object',
          subFields: [
            {
              fieldId: 'field1',
              label: { en: 'Field 1' },
              description: { en: 'Field 1 description' },
              viewAs: { representationKind: 'string' },
              hide: falseExpression,
              span: 12,
              margin: 0,
              override,
              required,
            },
            {
              fieldId: 'field2',
              label: { en: 'Field 2' },
              description: { en: 'Field 2 description' },
              viewAs: { representationKind: 'string' },
              hide: falseExpression,
              span: 12,
              margin: 0,
              override,
              required,
            },
          ]
        },
        hide: falseExpression,
        span: 12,
        margin: 0,
        override,
        required,
      }
    },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'listObject',
    label: { en: 'List Object as Table' },
    description: { en: 'List Object as Table description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'table',
      columns: [
        {
          fieldId: 'field1',
          label: { en: 'Field 1' },
          description: { en: 'Field 1 description' },
          viewAs: { representationKind: 'string' },
          hide: falseExpression,
          span: { flex: 1 },
          override,
          required,
          filterable: trueExpression,
          searchFullText: trueExpression,
        },
        {
          fieldId: 'field2',
          label: { en: 'Field 2' },
          description: { en: 'Field 2 description' },
          viewAs: { representationKind: 'string' },
          hide: falseExpression,
          span: { flex: 1 },
          override,
          required,
          filterable: trueExpression,
          searchFullText: trueExpression,
        },
      ],
      rowId: 'field1',
    },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'listObject',
    label: { en: 'List Object' },
    description: { en: 'List Object description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'list',
      field: {
        fieldId: 'field1',
        label: { en: 'Field 1' },
        description: { en: 'Field 1 description' },
        viewAs: {
          representationKind: 'object',
          subFields: [
            {
              fieldId: 'field1',
              label: { en: 'Field 1' },
              description: { en: 'Field 1 description' },
              viewAs: { representationKind: 'string' },
              hide: falseExpression,
              span: 12,
              margin: 0,
              override,
              required,
            },
            {
              fieldId: 'field2',
              label: { en: 'Field 2' },
              description: { en: 'Field 2 description' },
              viewAs: { representationKind: 'string' },
              hide: falseExpression,
              span: 12,
              margin: 0,
              override,
              required,
            },
          ]
        },
        hide: falseExpression,
        span: 12,
        margin: 0,
        override,
        required,
      }
    },
    span: 12,
    margin: 0,
  },
]
