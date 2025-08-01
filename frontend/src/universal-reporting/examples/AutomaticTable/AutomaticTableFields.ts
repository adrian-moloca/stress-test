import { tField } from '@smambu/lib.constants'
import { falseExpression, trueExpression } from '../utils'

export const automaticTableFields: tField[] = [
  {
    id: 'table',
    name: {
      en: 'table'
    },
    definition: {
      type: {
        kind: 'list',
        itemType: {
          type: {
            kind: 'object',
            object: {
              caseNumber: {
                type: {
                  kind: 'string'
                },
                readable: trueExpression,
                writable: falseExpression,
                mergePolicies: {
                  horizontal: 'OVERWRITE',
                  vertical: 'CHILD'
                }
              },
              patientName: {
                type: {
                  kind: 'string'
                },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: {
                  horizontal: 'OVERWRITE',
                  vertical: 'CHILD'
                }
              },
              patientNickName: {
                type: {
                  kind: 'string'
                },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: {
                  horizontal: 'OVERWRITE',
                  vertical: 'CHILD'
                }
              },
              patientNicTitle: {
                type: {
                  kind: 'string'
                },
                readable: trueExpression,
                writable: trueExpression,
                mergePolicies: {
                  horizontal: 'OVERWRITE',
                  vertical: 'CHILD'
                }
              }
            }
          },
          readable: trueExpression,
          writable: falseExpression,
          mergePolicies: {
            horizontal: 'SHY',
            vertical: 'CHILD'
          }
        }
      },
      readable: trueExpression,
      writable: falseExpression,
      mergePolicies: {
        horizontal: 'SHY',
        vertical: 'CHILD'
      },
      automaticValue: {
        expressionKind: 'literalList',
        value: [
          {
            proxyId: 'proxy-123456',
            caseNumber: '123456',
            surgeryName: 'Surgery Name',
            surgeryDate: '2021-01-01',
            doctorName: 'John Doe',
            patientName: 'Jane Doe',
            patientBirthdate: '1990-01-01',
            patientId: '1234567890'
          }]
      }
    },
    version: '1'
  }
]
