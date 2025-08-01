import { tViewItem } from '@smambu/lib.constants'
import { createFieldRepresentation, override, required, falseExpression, show } from '../utils'

export const simple2Representation: tViewItem[] = [
  createFieldRepresentation(
    'foostring',
    override,
    required,
    show,
    {
      representationKind: 'string',
    },
    4,
    2
  ),
  createFieldRepresentation(
    'foonumber',
    override,
    required,
    show,
    {
      representationKind: 'number',
    },
    3,
    2
  ),
  {
    fieldId: 'foostringcatfoonumber',
    label: { en: 'Foo string cat foonumber' },
    description: { en: 'Foo string cat foonumber description' },
    override: falseExpression,
    required,
    hide: falseExpression,
    viewAs: { representationKind: 'string' },
    span: 12,
    margin: 0,
  },
  {
    fieldId: 'foostringcatfoonumbercatfoonumber',
    label: { en: 'Foo string cat foonumber2' },
    description: { en: 'Foo string cat foonumber2 description' },
    override: falseExpression,
    required,
    hide: falseExpression,
    viewAs: { representationKind: 'string' },
    span: 12,
    margin: 0,
  },
]

/**
 *
 * dropdown che ti fa scegliere un tipo di materiale
 * dropdown che fa scegliere il materiale tra quelli di quel tipo
 *
 * in assenza di override da parte dell'utente, automatic value del secondo è il materiale col prezzo più alto.
 *
 * list PADRE:  ---------- con automatic value che fa una query per prendere i materiali di quel tipo. politica di merge FIGLI
 * item type: object SENZA automatic value!!!!!!
 * campo ID object no automatic value
 * campo prezzo va a prenderlo dal database
 *
 *
 */
