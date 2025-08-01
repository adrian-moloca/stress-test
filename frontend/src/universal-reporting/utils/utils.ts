import _ from 'lodash'
import { tParsedValues } from 'universal-reporting/types'

export const updateObject = (obj: any, path: string, value: any) => {
  setSafe(obj, path, value)
}

export const processUpdate = (
  newValues: tParsedValues,
  path: string,
  value: any,
) => {
  updateObject(newValues, path, value)
}

function setSafe (obj: any, path: string, value: any) {
  const pathParts = _.toPath(path)
  if (pathParts.length === 0) return obj

  let current = obj

  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i]
    const nextPart = pathParts[i + 1]
    const nextNextPart = pathParts[i + 2]

    if (String(parseInt(nextPart)) === nextPart && !Array.isArray(current[part]))
      current[part] = []

    if (
      Array.isArray(current[part]) &&
      String(parseInt(nextPart)) === nextPart &&
      current[part][parseInt(nextPart)] !== null &&
      typeof current[part][parseInt(nextPart)] !== 'undefined' &&
      typeof current[part][parseInt(nextPart)] !== 'object' &&
      typeof current[part][parseInt(nextPart)] !== 'function' &&
      (String(parseInt(nextNextPart)) !== nextNextPart || nextNextPart === undefined)
    )
      current[part][parseInt(nextPart)] = {}

    if (!current[part])
      current[part] = String(parseInt(nextPart)) === nextPart ? [] : {}

    current = current[part]
  }

  _.set(obj, path, value)
  return obj
}
