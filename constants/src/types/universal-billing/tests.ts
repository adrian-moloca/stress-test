import { tField } from './fields'

const _fieldsExample: tField[] = [
  {
    id: 'campo1',
    definition: {
      type: { kind: 'string' },
      readable: { expressionKind: 'literalBoolean', value: true, typeHint: { kind: 'boolean' } },
      writable: { expressionKind: 'literalBoolean', value: true, typeHint: { kind: 'boolean' } },
      automaticValue: {
        expressionKind: 'functionInvocation',
        function: 'concat',
        parameters: {
          stringsToConcat: {
            expressionKind: 'literalListOfExpressions',
            value: [
              { expressionKind: 'selfOperator', paths: ['campo2'] },
              { expressionKind: 'literalString', value: ' - ' },
              { expressionKind: 'literalString', value: 'bello' },
            ],
          },
        },
      },
      mergePolicies: {
        horizontal: 'OVERWRITE',
        vertical: 'PARENT',
      },
    },
    version: '1',
  },
]
