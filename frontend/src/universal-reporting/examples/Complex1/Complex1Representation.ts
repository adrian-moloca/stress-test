import { tViewItem } from '@smambu/lib.constants'
import { createFieldRepresentation, override, required, show } from '../utils'

export const complex1Representation: tViewItem[] = [
  createFieldRepresentation(
    'myString',
    override,
    required,
    show,
    { representationKind: 'string' },
    12,
    0
  ),
  createFieldRepresentation(
    'myObject',
    override,
    required,
    show,
    {
      representationKind: 'object',
      subFields: [
        {
          fieldId: 'fieldA',
          description: { en: 'Campo A' },
          label: { en: 'Campo A' },
          override,
          required,
          hide: show,
          viewAs: { representationKind: 'string' },
          span: 6,
          margin: 0,
        },
        {
          fieldId: 'fieldB',
          label: { en: 'Campo B' },
          description: { en: 'Campo B' },
          override,
          required,
          hide: show,
          viewAs: { representationKind: 'number' },
          span: 6,
          margin: 0,
        },
      ],
    },
    12,
    0
  ),
  createFieldRepresentation(
    'myObjectList',
    override,
    required,
    show,
    {
      representationKind: 'list',
      field: createFieldRepresentation(
        'item',
        override,
        required,
        show,
        {
          representationKind: 'object',
          subFields: [
            {
              fieldId: 'pippo',
              label: { en: 'Pippo' },
              description: { en: 'Valore fisso' },
              override,
              required,
              hide: show,
              viewAs: { representationKind: 'string' },
              span: 6,
              margin: 0,
            },
            {
              fieldId: 'pluto',
              label: { en: 'Pluto' },
              description: { en: 'Valore calcolato' },
              override,
              required,
              hide: show,
              viewAs: { representationKind: 'string' },
              span: 6,
              margin: 0,
            },
          ],
        },
        12,
        0
      ),
    },
    12,
    0
  ),
]
