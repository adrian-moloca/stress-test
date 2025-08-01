import { tViewItem } from '@smambu/lib.constants'
import { required, falseExpression, override } from '../utils'

export const simple5Representation: tViewItem[] = [
  {
    fieldId: 'field1Value',
    label: { en: 'Field 1' },
    description: { en: 'Field 1 description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'string',
    },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'field2Value',
    label: { en: 'Field 2' },
    description: { en: 'Field 2 description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'string',
    },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'field2ValueOverrideChild',
    label: { en: 'Field 2 Override Child' },
    description: { en: 'Field 2 Override Child description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'string',
    },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'object',
    label: { en: 'Object' },
    description: { en: 'Object description' },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'object',
      subFields: [
        {
          fieldId: 'field1ParentVertical',
          label: { en: 'Field 1 Parent Vertical' },
          description: { en: 'Field 1 Parent Vertical description' },
          override,
          required,
          hide: falseExpression,
          viewAs: { representationKind: 'string' },
          span: 12,
          margin: 0,
        },
        {
          fieldId: 'field2ChildVertical',
          label: { en: 'Field 2 Child Vertical' },
          description: { en: 'Field 2 Child Vertical description' },
          override,
          required,
          hide: falseExpression,
          viewAs: { representationKind: 'string' },
          span: 12,
          margin: 0,
        },
      ],
    },
    span: 12,
    margin: 0,
  },
]
