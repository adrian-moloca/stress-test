import { tViewItem } from '@smambu/lib.constants'
import { createFieldRepresentation, override, required, falseExpression, trueExpression, show } from '../utils'

export const simple1Representation: tViewItem[] = [
  // comment this
  /*
    comment for now
    createFieldRepresentation(
      'fooobject',
      override,
      readonly,
      show,
      {
        representationKind: 'accordion',
        subFields: [
          {
            fieldId: 'bar',
            label: { en: 'Bar' },
            description: { en: 'Bar description' },
            override,
            required,
            hide: falseExpression,
            viewAs: { representationKind: 'number' },
            span: 12,
            margin: 0
          },
          {
            fieldId: 'baz',
            label: { en: 'Baz' },
            description: { en: 'Baz description' },
            override,
            required,
            hide: falseExpression,
            span: 12,
            margin: 0,
            viewAs: {
              representationKind: 'accordion',
              subFields: [
                {
                  fieldId: 'mario',
                  label: { en: 'Mario' },
                  description: { en: 'Mario description' },
                  override,
                  required,
                  hide: falseExpression,
                  viewAs: { representationKind: 'string' },
                  span: 12,
                  margin: 0
                },
                {
                  fieldId: 'marco',
                  label: { en: 'Marco' },
                  description: { en: 'Marco description' },
                  override,
                  required,
                  hide: falseExpression,
                  viewAs: { representationKind: 'string' },
                  span: 6,
                  margin: 2
                },
                {
                  fieldId: 'franco',
                  label: { en: 'Franco' },
                  description: { en: 'Franco description' },
                  override,
                  required,
                  hide: falseExpression,
                  viewAs: { representationKind: 'string' },
                  span: 2,
                  margin: 2
                },
              ]
            },
          },
        ]
      },
      12,
      0
    ),

    createFieldRepresentation(
      'foostring',
      override,
      required,
      show,
      { representationKind: 'string' },
      4,
      2
    ),
    createFieldRepresentation(
      'foonumber',
      override,
      required,
      show,
      { representationKind: 'number' },
      4,
      2
    ),
    createFieldRepresentation(
      'fooboolean',
      override,
      required,
      show,
      { representationKind: 'boolean' },
      4,
      2
    ),
    createFieldRepresentation(
      'foodate',
      override,
      required,
      show,
      { representationKind: 'date', format: 'dd/MM/yyyy' },
      4,
      2
    ),
    createFieldRepresentation(
      'foodatewithouttimestamp',
      override,
      required,
      show,
      { representationKind: 'dateWithoutTimestamp', format: 'dd/MM/yyyy' },
      4,
      2
    ),
    createFieldRepresentation(
      'footimestamp',
      override,
      required,
      show,
      { representationKind: 'timestamp', format: 'dd/MM/yyyy HH:mm:ss' },
      4,
      2
    ),
    createFieldRepresentation(
      'fooemail',
      override,
      required,
      show,
      { representationKind: 'email' },
      12,
      0
    ),
    createFieldRepresentation(
      'fooliststring',
      override,
      required,
      show,
      { representationKind: 'list', field: createFieldRepresentation('foostring', override, required, show, { representationKind: 'string' }, 4, 2) },
      12,
      0
    ),
    createFieldRepresentation(
      'fooobject',
      override,
      required,
      show,
      {
        representationKind: 'object',
        subFields: [
          {
            fieldId: 'bar',
            label: { en: 'Bar' },
            description: { en: 'Bar description' },
            override,
            required,
            hide: falseExpression,
            viewAs: { representationKind: 'number' },
            span: 12,
            margin: 0
          },
          {
            fieldId: 'baz',
            label: { en: 'Baz' },
            description: { en: 'Baz description' },
            override,
            required,
            hide: falseExpression,
            viewAs: { representationKind: 'string' },
            span: 12,
            margin: 0
          },
        ],
      },
      12,
      0
    ),
    createFieldRepresentation(
      'foolistobject',
      override,
      required,
      show,
      {
        representationKind: 'list',
        field: createFieldRepresentation('fooobject', override, required, show, {
          representationKind: 'object',
          subFields: [
            {
              fieldId: 'id',
              label: { en: 'ID' },
              description: { en: 'ID description' },
              override,
              required,
              hide: falseExpression,
              viewAs: { representationKind: 'string' },
              span: 12,
              margin: 0
            },
            {
              fieldId: 'name',
              label: { en: 'Name' },
              description: { en: 'Name description' },
              override,
              required,
              hide: falseExpression,
              viewAs: { representationKind: 'string' },
              span: 12,
              margin: 0
            },
            {
              fieldId: 'age',
              label: { en: 'Age' },
              description: { en: 'Age description' },
              override,
              required,
              hide: falseExpression,
              viewAs: { representationKind: 'number' },
              span: 12,
              margin: 0
            },
          ]
        }, 4, 2)
      },
      12,
      0
    ),
    createFieldRepresentation(
      'foolistobject',
      override,
      required,
      show,
      {
        representationKind: 'table',
        columns: [
          {
            fieldId: 'id',
            label: { en: 'ID' },
            description: { en: 'ID description' },
            override,
            required,
            viewAs: { representationKind: 'string' },
            hide: falseExpression,
            searchFullText: falseExpression,
            filterable: falseExpression,
            span: {
              flex: 1,
            },
          },
          {
            fieldId: 'name',
            label: { en: 'Name' },
            description: { en: 'Name description' },
            override,
            required,
            hide: falseExpression,
            searchFullText: falseExpression,
            filterable: falseExpression,
            viewAs: { representationKind: 'string' },
            span: {
              flex: 1,
            },
          },
        ],
        rowId: 'id'
      },
      12,
      0
    ),
    */
  createFieldRepresentation(
    'fooenum',
    override,
    required,
    show,
    {
      representationKind: 'enum',
      idField: 'id',
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
                $label: { type: { kind: 'string' }, readable: trueExpression, writable: trueExpression, mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' } },
                id: { type: { kind: 'string' }, readable: trueExpression, writable: trueExpression, mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' } },
                value: { type: { kind: 'string' }, readable: trueExpression, writable: trueExpression, mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' } },
              },
            },
            readable: trueExpression,
            writable: trueExpression,
            mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
          },
        },
      },
    },
    12,
    0
  ),
  createFieldRepresentation(
    'fooobject',
    override,
    required,
    show,
    {
      representationKind: 'object',
      subFields: [
        {
          fieldId: 'bar',
          label: { en: 'Bar' },
          description: { en: 'Baz description' },
          override,
          required,
          hide: falseExpression,
          viewAs: {
            representationKind: 'object',
            subFields: [
              {
                fieldId: 'baz',
                label: { en: 'Baz' },
                description: { en: 'Baz description' },
                override,
                required,
                hide: falseExpression,
                viewAs: {
                  representationKind: 'object',
                  subFields: [
                    {
                      fieldId: 'mario',
                      label: { en: 'Mario' },
                      description: { en: 'Mario description' },
                      override,
                      required,
                      hide: falseExpression,
                      viewAs: {
                        representationKind: 'enum',
                        idField: 'id',
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
                                  $label: { type: { kind: 'string' }, readable: trueExpression, writable: trueExpression, mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' } },
                                  id: { type: { kind: 'string' }, readable: trueExpression, writable: trueExpression, mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' } },
                                  value: { type: { kind: 'string' }, readable: trueExpression, writable: trueExpression, mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' } },
                                },
                              },
                              readable: trueExpression,
                              writable: trueExpression,
                              mergePolicies: { vertical: 'PARENT', horizontal: 'OVERWRITE' },
                            },
                          },
                        },
                      },
                      span: 12,
                      margin: 0,
                    },
                    {
                      fieldId: 'marco',
                      label: { en: 'Marco' },
                      description: { en: 'Marco description' },
                      override,
                      required,
                      hide: falseExpression,
                      viewAs: { representationKind: 'string' },
                      span: 12,
                      margin: 0,
                    },
                    {
                      fieldId: 'franco',
                      label: { en: 'Franco' },
                      description: { en: 'Franco description' },
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
            ],
          },
          span: 12,
          margin: 0,
        },
      ],
    },
    12,
    0
  ),
  {
    fieldId: 'foostring',
    label: { en: 'Foo string' },
    description: { en: 'Foo string description' },
    override,
    required,
    hide: falseExpression,
    viewAs: { representationKind: 'string' },
    span: 12,
    margin: 0,
    displayExpression: {
      expressionKind: 'functionInvocation',
      function: 'concat',
      parameters: {
        stringsToConcat: {
          expressionKind: 'literalListOfExpressions',
          value: [
            {
              expressionKind: 'selfOperator',
              paths: ['foonumber'],
            },
            {
              expressionKind: 'literalString',
              value: '-',
            },
            {
              expressionKind: 'literalString',
              value: 'foo',
            },
          ],
        },
      },
    },
  },
]
