import useCall from '../useCall'
import { evaluateExpression, tEvaluateNamedExpressionData, tExecuteQueryData, tExpression, tExpressionResult, tScope } from '@smambu/lib.constants'
import { getLanguage, getLocalStorageItem } from 'utilities'
import { ACCESS_TOKEN } from 'config/constant'
import { useAppSelector } from 'store'
import React, { useState } from 'react'
import { ExpressionsApi } from 'api/ur/expressions.api'

export const useExecuteQuery = () => {
  const call = useCall()

  const executeQuery = (data: tExecuteQueryData) => call(async function executeQuery () {
    const response = await ExpressionsApi.executeQuery(data)

    return response
  })

  return executeQuery
}

export const useEvaluateNamedExpression = () => {
  const call = useCall()

  const evaluateNamedExpression = (data: tEvaluateNamedExpressionData) => call(
    async function evaluateNamedExpression () {
      const response = await ExpressionsApi.evaluateNamedExpression(data)

      return response
    }
  )

  return evaluateNamedExpression
}

const useExecuteHttp = () => {
  const call = useCall()

  const executeHttp = (
    method: string,
    url: string,
    body: BodyInit | undefined,
    token: string,
  ) => call(async function executeHttp () {
    const parsedBody = body ? JSON.stringify(body) : undefined

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      } as HeadersInit,
      body: parsedBody,
    })

    if (!response.ok) throw new Error('fetchError')

    return response.json()
  })

  return executeHttp
}

export const useEvaluateExpression = () => {
  const userPermissions = useAppSelector(state => state.auth.permissions)
  const call = useCall()
  const evaluateNamedExpression = useEvaluateNamedExpression()
  const executeQuery = useExecuteQuery()
  const executeHttp = useExecuteHttp()
  const selectedLocale = getLanguage()
  const token = getLocalStorageItem(ACCESS_TOKEN)

  const executeHttpFnc = (method: string, url: string, body: BodyInit | undefined) =>
    executeHttp(method, url, body, token!)

  const evaluateExpressionFnc = (
    mainExpression: tExpression,
    self?: tScope,
  ): Promise<tExpressionResult> => call(async function evaluateExpressionFnc () {
    const firstScope = {
      ...(self || {}),
      self: {
        ...(self?.self || {}),
        userPermissions,
      },
    }

    const response = await evaluateExpression({
      mainExpression,
      firstScope,
      selectedLocale,
      executeQuery,
      evaluateNamedExpression,
      executeHttp: executeHttpFnc,
    })

    return response
  }, undefined, true)

  return evaluateExpressionFnc
}

export const useEvaluatedValue = (expression?: tExpression) => {
  const [value, setValue] = useState<any>(null)
  const evaluateExpression = useEvaluateExpression()
  const stringifiedExpression = JSON.stringify(expression)

  React.useEffect(() => {
    const evaluate = async () => {
      if (expression == null) {
        setValue(null)
        return
      }

      const result = await evaluateExpression(expression)
      setValue(result)
    }
    evaluate()
  }, [stringifiedExpression])

  return value
}
