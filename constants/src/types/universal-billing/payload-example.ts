import { tConcatInvocationExpression } from './applied-functions/concat'
import { tObjectLiteral } from './literals'
import { tAndExpression, tBinaryExpression, tDotExpression, tLambdaExpression, tNotExpression, tOrExpression, tTypedExpression } from './expressions'
import { tQueryExpression, tQueryTieOperator, tQueryWhereExpression } from './query'
import { tMapInvocationExpression } from './applied-functions/map'
import { tConcatArrayInvocationExpression, tUniqueInvocationExpression } from './applied-functions'

const _formFields = [
  {
    id: 'testList',
    readable: { expressionKind: 'literalBoolean', value: true, typeHint: { kind: 'boolean' } },
    writable: { expressionKind: 'literalBoolean', value: true, typeHint: { kind: 'boolean' } },
    type: {
      kind: 'list',
      itemType: { kind: 'number' },
    }
  },
  {
    id: 'testNumber',
    type: {
      kind: 'number',
    },
    readable: { expressionKind: 'literalBoolean', value: true, typeHint: { kind: 'boolean' } },
    writable: { expressionKind: 'literalBoolean', value: true, typeHint: { kind: 'boolean' } },
  }
]

// function examples:

const _concat: tConcatInvocationExpression = {
  expressionKind: 'functionInvocation',
  function: 'concat',
  parameters: {
    stringsToConcat: {
      expressionKind: 'literalList',
      value: [
        'test',
        'concat'
      ]
    }
  }
}

const _concatArray: tConcatArrayInvocationExpression = {
  expressionKind: 'functionInvocation',
  function: 'concatArray',
  parameters: {
    arraysToConcat: {
      expressionKind: 'literalList',
      value: [
        {
          expressionKind: 'literalString',
          value: 'test'
        },
        {
          expressionKind: 'literalString',
          value: 'concat'
        }
      ]
    }
  }
}

const _unique: tUniqueInvocationExpression = {
  expressionKind: 'functionInvocation',
  function: 'unique',
  parameters: {
    arrayToUnique: {
      expressionKind: 'literalList',
      value: [
        {
          expressionKind: 'literalString',
          value: 'test'
        },
        {
          expressionKind: 'literalString',
          value: 'concat'
        }
      ]
    }
  }
}

const _uniqueWithGetKey : tUniqueInvocationExpression = {
  expressionKind: 'functionInvocation',
  function: 'unique',
  parameters: {
    arrayToUnique: {
      expressionKind: 'literalList',
      value: [
        {
          expressionKind: 'literalString',
          value: 'test'
        },
        {
          expressionKind: 'literalString',
          value: 'concat'
        }
      ]
    },
    getKey: {
      expressionKind: 'lambdaOperator',
      args: ['current'],
      body: {
        expressionKind: 'dotOperator',
        source: {
          expressionKind: 'symbolOperator',
          name: 'current'
        },
        paths: ['id']
      }
    }
  }
}

const _mapInvocation: tMapInvocationExpression = {
  expressionKind: 'functionInvocation',
  function: 'map',
  parameters: {
    sourceArray: {
      expressionKind: 'literalList',
      value: [
        10,
        15
      ]
    },
    callback: {
      expressionKind: 'lambdaOperator',
      args: ['current'],
      body: {
        expressionKind: 'sumOperator',
        left: {
          expressionKind: 'literalNumber',
          value: 5
        },
        right: {
          expressionKind: 'symbolOperator',
          name: 'current'
        }
      }
    }
  }
}

// example:

const caseObj: tObjectLiteral = {
  expressionKind: 'literalObj',
  value: {
    case: {
      expressionKind: 'literalObj',
      value: {
        isBillable: {
          expressionKind: 'literalBoolean',
          value: false
        }
      }
    }
  }
}

const billableExpression: tDotExpression = {
  expressionKind: 'dotOperator',
  source: caseObj,
  paths: ['case', 'isBillable']
}

const _notBillable: tNotExpression = {
  expressionKind: 'notOperator',
  args: billableExpression
}

const _billableCond: tBinaryExpression = {
  expressionKind: 'equalsOperator',
  left: {
    expressionKind: 'notOperator',
    args: {
      expressionKind: 'dotOperator',
      source: {
        expressionKind: 'literalObj',
        value: {
          case: {
            expressionKind: 'literalObj',
            value: {
              isBillable: {
                expressionKind: 'literalBoolean',
                value: false
              }
            }
          }
        }
      },
      paths: ['case', 'isBillable']
    }
  },
  right: {
    expressionKind: 'literalBoolean',
    value: true
  }
}

const _lambdaDefinition: tLambdaExpression = {
  expressionKind: 'lambdaOperator',
  args: ['input'],
  body: {
    expressionKind: 'sumOperator',
    left: {
      expressionKind: 'literalNumber',
      value: 5
    },
    right: {
      expressionKind: 'symbolOperator',
      name: 'input'
    }
  },
}

// example query "plain" version
// materialsDB.user.name === 'test' || materialsDB.quantity > 10

const whereFirstClause: tQueryWhereExpression<'equalsOperator', 'materialsDatabase'> = {
  expressionKind: 'queryWhere',
  path: 'user.name',
  arg: {
    expressionKind: 'literalString',
    value: 'test'
  },
  operator: 'equalsOperator',
}

const whereSecondClause: tQueryWhereExpression<'greaterThanOperator', 'materialsDatabase'> = {
  expressionKind: 'queryWhere',
  path: 'quantity',
  arg: {
    expressionKind: 'literalNumber',
    value: 10
  },
  operator: 'greaterThanOperator'
}

const whereClause: tQueryTieOperator<'OR'> = {
  expressionKind: 'queryTie',
  tieOperator: 'OR',
  args: [whereFirstClause, whereSecondClause]
}

const _queryExample: tQueryExpression<'materialsDatabase'> = {
  expressionKind: 'query',
  collection: 'materialsDatabase',
  where: whereClause,
  atDate: {
    expressionKind: 'literalDate',
    value: new Date().toISOString()
  },
  yields: {
    id: {
      expressionKind: 'literalBoolean',
      value: true,
      typeHint: { kind: 'boolean' }
    },
    user: {
      expressionKind: 'literalBoolean',
      value: true,
      typeHint: { kind: 'boolean' }
    },
    quantity: {
      expressionKind: 'literalBoolean',
      value: true,
      typeHint: { kind: 'boolean' }
    },
  }

}

const _typedExpressionExample: tTypedExpression<{ kind: 'string' }> = {
  expressionKind: 'equalsOperator',
  left: { expressionKind: 'literalString', value: 'abc' },
  right: { expressionKind: 'literalString', value: 'cde' },
  typeHint: { kind: 'string' }
}

export const andExample: tAndExpression = {
  expressionKind: 'andOperator',
  args: [
    { expressionKind: 'literalBoolean', value: true },
    { expressionKind: 'literalBoolean', value: false }
  ]
}

export const orExample: tOrExpression = {
  expressionKind: 'orOperator',
  args: [
    { expressionKind: 'literalBoolean', value: true },
    { expressionKind: 'literalBoolean', value: false }
  ]
}
