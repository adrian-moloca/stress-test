import { anagraphicsTypes } from '../enums'
import { tExecuteHttp, tSupportedQueriesCollections, tExecuteQueryPayload, tExecuteQuery, tExecuteQueryData, tEvaluateNamedExpression, tEvaluateNamedExpressionData } from '../types'

export function getGenericExecuteHttp (authorization: string): tExecuteHttp {
  return async (method, url, body) => {
    const parsedBody = body != null ? JSON.stringify(body) : undefined

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
      } as HeadersInit,
      body: parsedBody,
    })

    if (!response.ok) throw new Error('fetchError')

    return response.json()
  }
}

export function getBackendExecuteHttp (): tExecuteHttp {
  return async (method, url, body) => {
    const stringifiedBody = JSON.stringify(body)
    console.error(`execute http backend called with method ${method} on ${url} and body ${stringifiedBody}`)

    throw Error('Http expressions are forbidden in the backend')
  }
}

export function getMiddlewareExecuteQuery (): tExecuteQuery {
  return async (data: tExecuteQueryData) => {
    const stringifiedData = JSON.stringify(data)
    console.error(`execute query middleware called with data ${stringifiedData}`)

    throw Error('Query expressions are forbidden in the middleware')
  }
}

export function getMiddlewareEvaluateNamedExpressions (): tEvaluateNamedExpression {
  return async (data: tEvaluateNamedExpressionData) => {
    const stringifiedData = JSON.stringify(data)
    console.error(`execute named expression middleware called with data ${stringifiedData}`)

    throw Error('Named expressions are forbidden in the middleware')
  }
}

export const QUERY_CONFIGURATIONS: Record<tSupportedQueriesCollections, {
  pattern: { role: string, cmd: 'query' },
  data?: Partial<tExecuteQueryPayload>,
}> = {
  materialsDatabase: {
    pattern: { role: 'anagraphics', cmd: 'query' },
    data: {
      anagraphicType: anagraphicsTypes.MATERIALS_DATABASE,
      subType: anagraphicsTypes.MATERIALS_DATABASE,
    },
  },

  users: {
    pattern: { role: 'users', cmd: 'query' }
  },

  cases: {
    pattern: { role: 'cases', cmd: 'query' }
  },

  contracts: {
    pattern: { role: 'contracts', cmd: 'query' }, data: { collection: 'contracts' }
  },
  doctorOpStandards: {
    pattern: { role: 'contracts', cmd: 'query' },
    data: { collection: 'doctorOpStandards' }
  },
  anesthesiologistOpStandards: {
    pattern: { role: 'contracts', cmd: 'query' },
    data: { collection: 'anesthesiologistOpStandards' }
  },

  orManagement: {
    pattern: { role: 'orManagement', cmd: 'query' }
  },

  patients: {
    pattern: { role: 'patients', cmd: 'query' }
  },

  pricePointConfigs: {
    pattern: { role: 'systemConfigurations', cmd: 'query' },
    data: { collection: 'pricePointConfigs' }
  },

  generalData: {
    pattern: { role: 'systemConfigurations', cmd: 'query' },
    data: { collection: 'generalData' }
  },
} as const
