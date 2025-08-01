import { tViewItem } from '@smambu/lib.constants'
import { required, falseExpression, override } from '../utils'

export const vatValuesRepresentation: tViewItem[] = [
  {
    fieldId: 'vatValues',
    label: {
      en: 'VAT Values',
      de: 'Mehrwertsteuersätze'
    },
    description: {
      en: 'Configure VAT percentages and their validity periods',
      de: 'Konfigurieren Sie die Mehrwertsteuersätze und ihre Gültigkeitszeiträume'
    },
    override,
    required,
    hide: falseExpression,
    viewAs: {
      representationKind: 'table',
      rowId: 'id',
      columns: [
        {
          override: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          required: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          hide: {
            expressionKind: 'literalBoolean',
            value: false,
            typeHint: {
              kind: 'boolean'
            }
          },
          span: {
            flex: 1
          },
          fieldId: 'fullPercentage',
          label: {
            en: 'Full Percentage',
            de: 'Voller Satz'
          },
          description: {
            en: 'Full VAT percentage',
            de: 'Voller Mehrwertsteuersatz'
          },
          searchFullText: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          filterable: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          viewAs: {
            representationKind: 'positivePrice',
            currency: '€'
          }
        },
        {
          override: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          required: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          hide: {
            expressionKind: 'literalBoolean',
            value: false,
            typeHint: {
              kind: 'boolean'
            }
          },
          span: {
            flex: 1
          },
          fieldId: 'halfPercentage',
          label: {
            en: 'Half Percentage',
            de: 'Verringerter Satz'
          },
          description: {
            en: 'Half VAT percentage',
            de: 'Verringerter Mehrwertsteuersatz'
          },
          searchFullText: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          filterable: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          viewAs: {
            representationKind: 'positivePrice',
            currency: '€'
          }
        },
        {
          override: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          required: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          hide: {
            expressionKind: 'literalBoolean',
            value: false,
            typeHint: {
              kind: 'boolean'
            }
          },
          span: {
            flex: 1
          },
          fieldId: 'validFrom',
          label: {
            en: 'Valid From',
            de: 'Gültig ab'
          },
          description: {
            en: 'Date from which the VAT percentage is valid',
            de: 'Datum ab dem der Mehrwertsteuersatz gültig ist'
          },
          searchFullText: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          filterable: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: {
              kind: 'boolean'
            }
          },
          viewAs: {
            representationKind: 'date',
            format: 'yyyy-MM-dd'
          }
        }
      ]
    },
    span: 12,
    margin: 0,
  }
]
