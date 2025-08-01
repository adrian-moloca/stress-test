import { get, has, set } from 'lodash'
import { checkIfDate, isExplorableObject, tryParseDate } from './diffs'

const MAX_FIELDS_DEPTH = 1
const maxDepthExceptions = ['timestamps']
const IGNORED_FIELDS = [
  'lastStatusEdit',
  'associatedPatient',
  'bg',
  'uploads',
  'checkinUploads',
  'checkoutUploads',
  'intraOpUploads',
  // mongodb fields
  'createdAt',
  'updatedAt'
]

export const isIgnoredField = (fieldName: string) => {
  if (IGNORED_FIELDS.includes(fieldName)) return true

  // trying to exclude tmp fields and mongofields
  if (fieldName.startsWith('_')) return true

  return false
}

export const flattenObject = (inputObject: any) => {
  const returnObj: Record<string, unknown> = {}

  for (const currentField in inputObject) {
    if (!inputObject[currentField] || isIgnoredField(currentField)) continue

    const canExplore = isExplorableObject(inputObject[currentField])
    if (canExplore) {
      let flatObject = flattenObject(inputObject[currentField])
      for (let x in flatObject) {
        if (!flatObject[x]) continue

        returnObj[currentField + '.' + x] = flatObject[x]
      }
    } else {
      returnObj[currentField] = inputObject[currentField]
    }
  }

  return returnObj
}

export const getChangedFields = (initialValuesObj: any,
  changedValuesMap: Record<string, any>,
  maxDepth?: number) => {
  const changedKeys: string[] = []

  Object.entries(changedValuesMap)?.forEach(entry => {
    const [key, oldValue] = entry
    const newValue = get(initialValuesObj, key)

    const isNewDate = checkIfDate(newValue)
    const isOldDate = checkIfDate(oldValue)

    let parsedOldValue, parsedNewValue

    // Little explanation:
    // Because the dates are handled in a "mixed" way, we might have the same
    // field in two different formats, in the initial and changed value respectively
    // i.e. the data coming "straight from the db" is usually a string rapresentation
    // of the date, while the one coming from the frontend input is a Date object
    //
    // So we check whether one of the two is a (valid) date: if this is the case,
    // we "parse" the new value in it's string form and we compare them.
    //
    // This mechanism could be extended to some other "complex data" (e.g. the
    // materials arrays) when we extend the "max depth level" in order to
    // accomodate the field-level change
    if (isNewDate || isOldDate) {
      parsedOldValue = tryParseDate(oldValue)
      parsedNewValue = tryParseDate(newValue)
    } else {
      parsedOldValue = oldValue
      parsedNewValue = newValue
    }

    if (parsedNewValue !== parsedOldValue) changedKeys.push(key)
  })

  const parsedFields = new Set<string>()
  const maxFieldDepth = maxDepth ?? MAX_FIELDS_DEPTH

  changedKeys.forEach(current => {
    const skippable = maxDepthExceptions.some(ll => current.startsWith(ll))

    if (skippable) {
      parsedFields.add(current)
      return
    }

    const rawField = current.split('.')

    parsedFields.add(rawField.slice(0, maxFieldDepth).join('.'))
  })

  return [...parsedFields]
}

export const hasPath = (obj:Record<string, unknown>, path: string) => {
  return has(obj, path)
}

export const getNestedValue = (obj:Record<string, unknown>, path: string) => {
  return get(obj, path)
}

export const setNestedValue = (obj:Record<string, unknown>,
  path: string,
  value: unknown) => {
  set(obj, path, value)
}
