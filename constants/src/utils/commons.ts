import { isValid } from 'date-fns'
import { IGenericError, tMPPattern, tRedisLockVars } from '../types'
import { retry, timeout } from 'rxjs'
import uniqid from 'uniqid'
import { Component } from '../enums'
import { ClientProxy } from '@nestjs/microservices'

export function convertObjectToArray (values: any) {
  return Object.keys(values).map((key: any) => values[key])
}

export function mpPatternToString (pattern: tMPPattern) {
  return `${pattern.role} - ${pattern.cmd}`
}

export const findChangedFields = (obj: any, originalObj: any = {}, path = '', changedFields: any = {}) => {
  for (let key in obj)
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      const currentPath = path ? path + '.' + key : key
      const originalValue = originalObj[key]

      if (Array.isArray(obj[key]))
        if (!Array.isArray(originalValue)) changedFields[currentPath] = obj[key]
        else if (obj[key].length !== originalValue.length) changedFields[currentPath] = obj[key]
        else
          for (let i = 0; i < obj[key].length; i++) {
            const arrayPath = currentPath + '[' + i + ']'
            if (typeof obj[key][i] === 'object' && !Array.isArray(obj[key][i]))
              findChangedFields(obj[key][i], originalValue[i] || {}, arrayPath, changedFields)
            else if (obj[key][i] !== originalValue[i]) changedFields[arrayPath] = obj[key][i]
          }
      else if (typeof obj[key] === 'object')
        findChangedFields(obj[key], originalValue || {}, currentPath, changedFields)
      else if (obj[key] !== originalValue) changedFields[currentPath] = obj[key]
    }

  return changedFields
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const checkTwoDatesEqual = (date1: any, date2: any) => {
  if (!date1 || !isValid(new Date(date1)) || !date2 || !isValid(new Date(date2))) return false

  return new Date(date1).getTime() === new Date(date2).getTime()
}

export const downloadFileForFE = (fileBlob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(fileBlob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const getQueryParams = (search: string): Record<string, string> =>
  search
    .slice(search.indexOf('?') + 1)
    .split('&')
    .reduce((curr, hash) => {
      const [key, val] = hash.split('=')
      return { ...curr, [key]: decodeURIComponent(val) }
    }, {})

export const awaitableTimer = (ms: number) => {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export const parseBrowserLanguage = (languageRaw: string) => {
  const language = languageRaw.split('-')[0]

  return language
}

export const parseErrorMessage = (error: IGenericError) => {
  const message = error?.message

  return message || JSON.stringify(error)
}

export const getObjectKey = (obj: any, key: string) => key.split('.').reduce((o, x) => (o?.[x] == null ? o : o[x]), obj)

export const callMSWithTimeoutAndRetry = async (
  client: ClientProxy,
  pattern: tMPPattern,
  payload: unknown,
  component: Component,
  retryAttempts?: number,
  timeoutMs?: number,
) => {
  try {
    const attempts = retryAttempts || Number(process.env.NEST_RETRY_ATTEMPTS) || 0
    const timeoutMsValue = timeoutMs || Number(process.env.NEST_TIMEOUT_MS) || 0

    const res = await client
      .send(pattern, payload)
      .pipe(timeout(timeoutMsValue))
      .pipe(retry({ count: attempts, delay: 500 })) // TODO: make the delay an env var
      .toPromise()
    return res
  } catch (error) {
    const parsedPattern = mpPatternToString(pattern)
    const errorMessage = `Error in mp "${parsedPattern} called by ${component}"`

    console.error(errorMessage)
    console.error('callMSWithTimeoutAndRetry original error:', error)

    // XXX we do this instead of rethrowing "error" directly because not every
    // error returned here by rxjs is an instance of the "Error" js class,
    // and when that happens it breaks the promise chain
    const message = parseErrorMessage(error as IGenericError)

    throw new Error(message)
  }
}

export const isValidNumber = (number: any) => typeof number === 'number' && !isNaN(number)

export const getMaterialLabel = (option: any) => `${option?.code ?? ''} - ${option?.name ?? ''}`

export const getRandomUniqueId = () => uniqid()

export const validateEmail = (email: string) =>
  email
    .toLowerCase()
    .match(
      /^[A-Za-zÀ-ÿŸæœÆŒąćęłńóśźżšāčĄĆĘŁŃÓŚŹŻĂȘȚășț0-9_+&*'#-]+(?:\.[A-Za-zÀ-ÿŸæœÆŒąćęłńóśźżšāčĄĆĘŁŃÓŚŹŻĂȘȚășț0-9_+&*'#-]+)*@(?:[A-Za-zÀ-ÿŸæœÆŒąćęłńóśźżšāčĄĆĘŁŃÓŚŹŻĂȘȚășț0-9_-]+\.)+[A-Za-zÀ-ÿŸæœÆŒąćęłńóśźżšāčĄĆĘŁŃÓŚŹŻĂȘȚășț]{2,20}$/,
    )

export const sanitizeRegex = (regex: string) =>
  regex
    .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    .replace(/\\{2,}/g, '\\')
    .replace(/\\{2,}/g, '\\')

export const getArraysIntersection = <T extends number | boolean | string>(
  array1: T[],
  array2: T[]) => {
  let elementsSet:Set<T>
  if (array1.length > array2.length) {
    elementsSet = new Set(array2)

    return array1.filter(current => elementsSet.has(current))
  } else {
    elementsSet = new Set(array1)

    return array2.filter(current => elementsSet.has(current))
  }
}

export const prettifyObject = (object: unknown) => {
  return JSON.stringify(object, null, 4)
}

export const parseRedisLockVars = (rawEnv: Record<string, string | undefined>):tRedisLockVars => {
  const REDISLOCK_RETRY_COUNT = rawEnv.REDISLOCK_RETRY_COUNT ?? ''
  const REDISLOCK_REQUESTED_LOCK_DURATION = rawEnv.REDISLOCK_REQUESTED_LOCK_DURATION ?? ''
  const REDISLOCK_DRIFT_FACTOR = rawEnv.REDISLOCK_DRIFT_FACTOR ?? ''
  const REDISLOCK_RETRY_DELAY = rawEnv.REDISLOCK_RETRY_DELAY ?? ''
  const REDISLOCK_RETRY_JITTER = rawEnv.REDISLOCK_RETRY_JITTER ?? ''
  const REDISLOCK_AUTOMATIC_EXTENSION_THRESHOLD = rawEnv.REDISLOCK_AUTOMATIC_EXTENSION_THRESHOLD ?? ''

  const retryCount = parseInt(REDISLOCK_RETRY_COUNT)
  const lockDuration = parseInt(REDISLOCK_REQUESTED_LOCK_DURATION)
  const driftFactor = parseInt(REDISLOCK_DRIFT_FACTOR)
  const retryDelay = parseInt(REDISLOCK_RETRY_DELAY)
  const retryJitter = parseInt(REDISLOCK_RETRY_JITTER)
  const automaticExtensionThreshold = parseInt(REDISLOCK_AUTOMATIC_EXTENSION_THRESHOLD)

  if (isNaN(lockDuration))
    throw new Error('Error: requested lock duration is not set')

  if (isNaN(driftFactor))
    throw new Error('Error: drift factor is not set')

  if (isNaN(retryDelay))
    throw new Error('Error: retry delay is not set')

  if (isNaN(retryJitter))
    throw new Error('Error: retry jitter is not set')

  if (isNaN(automaticExtensionThreshold))
    throw new Error('Error: automatic extension threshold is not set')

  if (isNaN(retryCount))
    throw new Error('Error: retry count is not set')

  return {
    retryCount,
    lockDuration,
    driftFactor,
    retryDelay,
    retryJitter,
    automaticExtensionThreshold
  }
}
