// TODO: delete me, i'm only for testing
import {
  MERGING_POLICIES,
  tBillingConfig,
  tBooleanType,
  tCondition,
  tDomain,
  tExpression,
  tField,
  tFieldType,
  tQueryExpression,
  tStringType,
  tTrigger,
  tTypedExpression,
  VERTICAL_MERGING_POLICIES,
} from '@smambu/lib.constantsjs'

const booleanTrue: tTypedExpression<tBooleanType> = {
  expressionKind: 'literalBoolean',
  value: true,
  typeHint: {
    kind: 'boolean',
  },
}

const booleanFalse: tTypedExpression<tBooleanType> = {
  expressionKind: 'literalBoolean',
  value: false,
  typeHint: {
    kind: 'boolean',
  },
}

export const getBillingConfig = () => {
  const domains: tDomain[] = []

  // case is in discharged status
  const isDischarged: tCondition = {
    expressionKind: 'equalsOperator',
    left: {
      expressionKind: 'dotOperator',
      paths: ['status'],
      source: {
        expressionKind: 'selfOperator',
        paths: ['context', 'caseNumber'],
      },
    },
    right: {
      expressionKind: 'literalString',
      value: 'DISCHARGED',
    },
    typeHint: { kind: 'boolean' },
  }

  const isCreated: tCondition = {
    expressionKind: 'equalsOperator',
    left: {
      expressionKind: 'dotOperator',
      paths: ['status'],
      source: {
        expressionKind: 'symbolOperator',
        name: 'currentValues',
      },
    },
    right: {
      expressionKind: 'literalString',
      value: 'LOCKED',
    },
    typeHint: { kind: 'boolean' },
  }

  const contextKeyExpression: tTypedExpression<tStringType> = {
    expressionKind: 'functionInvocation',
    function: 'concat',
    parameters: {
      stringsToConcat: {
        expressionKind: 'literalListOfExpressions',
        value: [
          {
            expressionKind: 'literalString',
            value: 'proxyBilling-',
          },
          {
            expressionKind: 'symbolOperator',
            name: 'sourceDocId',
          },
        ],
      },
    },
    typeHint: { kind: 'string' },
  }

  const pippo: tFieldType = {
    kind: 'object',
    object: {
      caseNumber: {
        type: { kind: 'string' },
        readable: booleanTrue,
        writable: booleanTrue,
        mergePolicies: {
          vertical: 'PARENT',
          horizontal: 'OVERWRITE',
        },
      },
      caseCategory: {
        type: { kind: 'string' },
        readable: booleanTrue,
        writable: booleanTrue,
        mergePolicies: {
          vertical: 'PARENT',
          horizontal: 'OVERWRITE',
        },
      },
    },
  }

  const emitExpression: tExpression = {
    expressionKind: 'objectOfExpressions',
    value: {
      caseNumber: {
        expressionKind: 'dotOperator',
        paths: ['caseNumber'],
        source: {
          expressionKind: 'symbolOperator',
          name: 'currentValues',
        },
      },
    },
    typeHint: pippo,
  }

  const trigger: tTrigger = {
    name: { en: 'Case trigger' },
    eventType: 'cases-created',
    condition: booleanTrue,
    emitExpression,
    contextKey: contextKeyExpression,
  }

  // come caso facciamo un case che viene aggiornato o creat, e creiamo un
  // proxy con nome e nickname del paziente
  // il nickname si modifica quando si cambia il patient

  const caseNumber: tExpression = {
    expressionKind: 'selfOperator',
    paths: ['context', 'caseNumber'],
  }

  const caseIdField: tField = {
    id: 'caseNumber',
    name: { en: 'case number' },
    definition: {
      type: { kind: 'string' },
      readable: booleanTrue,
      writable: booleanFalse,
      automaticValue: caseNumber,
      mergePolicies: {
        horizontal: MERGING_POLICIES.OVERWRITE,
        vertical: VERTICAL_MERGING_POLICIES.CHILD,
      },
    },
    version: '1',
  }

  const patientNameFromCaseQuery: tQueryExpression<'cases'> = {
    collection: 'cases',
    expressionKind: 'query',
    where: {
      args: [
        {
          arg: {
            expressionKind: 'selfOperator',
            paths: ['context', 'caseNumber'],
          },
          expressionKind: 'queryWhere',
          operator: 'equalsOperator',
          path: 'caseNumber',
        },
      ],
      expressionKind: 'queryTie',
      tieOperator: 'AND',
    },
    yields: {
      'bookingPatient.name': {
        expressionKind: 'literalBoolean',
        value: true,
        typeHint: { kind: 'boolean' },
      },
    },
  }

  const patientNameExpression: tExpression = {
    expressionKind: 'dotOperator',
    paths: [0, 'bookingPatient', 'name'],
    source: patientNameFromCaseQuery,
  }

  const patientName: tField = {
    id: 'patientName',
    name: { en: 'patient name' },
    definition: {
      type: { kind: 'string' },
      readable: booleanTrue,
      writable: booleanTrue,
      automaticValue: patientNameExpression,
      mergePolicies: {
        horizontal: MERGING_POLICIES.OVERWRITE,
        vertical: VERTICAL_MERGING_POLICIES.CHILD,
      },
    },
    version: '1',
  }

  const patientNickNameExpression: tExpression = {
    expressionKind: 'functionInvocation',
    function: 'concat',
    parameters: {
      stringsToConcat: {
        expressionKind: 'literalListOfExpressions',
        value: [
          {
            expressionKind: 'selfOperator',
            paths: ['dynamicFields', 'patientName', 'fieldValue'],
          },
          {
            expressionKind: 'literalString',
            value: 'rocks',
          },
        ],
      },
    },
  }

  const patientNickName: tField = {
    id: 'patientNickName',
    name: { en: 'patient nick' },
    definition: {
      type: { kind: 'string' },
      readable: booleanTrue,
      writable: booleanTrue,
      automaticValue: patientNickNameExpression,
      mergePolicies: {
        horizontal: MERGING_POLICIES.OVERWRITE,
        vertical: VERTICAL_MERGING_POLICIES.CHILD,
      },
    },
    version: '1',
  }

  const needsNickTitle: tCondition = {
    expressionKind: 'notOperator',
    args: {
      expressionKind: 'equalsOperator',
      left: {
        expressionKind: 'selfOperator',
        paths: ['dynamicFields', 'patientName', 'fieldValue'],
      },
      right: {
        expressionKind: 'literalString',
        value: 'TEST',
      },
    },
    typeHint: { kind: 'boolean' },
  }

  const patientNickTitleExpression: tExpression = {
    expressionKind: 'functionInvocation',
    function: 'concat',
    parameters: {
      stringsToConcat: {
        expressionKind: 'literalListOfExpressions',
        value: [
          {
            expressionKind: 'selfOperator',
            paths: ['dynamicFields', 'patientName', 'fieldValue'],
          },
          {
            expressionKind: 'literalString',
            value: ' - aggiornato perchè non è TEST',
          },
        ],
      },
    },
  }

  const patientNickTitle: tField = {
    id: 'patientNicTitle',
    name: { en: 'patient nick title' },
    definition: {
      type: { kind: 'string' },
      readable: booleanTrue,
      writable: booleanTrue,
      automaticValue: patientNickTitleExpression,
      mergePolicies: {
        horizontal: MERGING_POLICIES.OVERWRITE,
        vertical: VERTICAL_MERGING_POLICIES.CHILD,
      },
      condition: needsNickTitle,
    },
    version: '2',
  }

  const proxyFields: tField[] = [caseIdField, patientName, patientNickName, patientNickTitle]

  const anestDomain: tDomain = {
    domainId: 'testDomain',
    domainName: { en: 'test domain' },
    domainDescription: { en: 'test domain description' },
    trigger,
    proxyFields,
    documentTypes: [],
    proxyDetails: [],
    proxyTable: [],
    canAccessProxies: booleanTrue,
    canAccessProxyDetails: booleanTrue,
    canEditProxy: booleanTrue
  }

  domains.push(anestDomain)

  const billingConfig: tBillingConfig = {
    domains,
  }

  return JSON.stringify(billingConfig)
}
