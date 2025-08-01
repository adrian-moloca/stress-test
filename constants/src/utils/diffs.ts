import { format, isValid } from 'date-fns'
import { isEqual } from 'lodash'
import { dateString } from '../constants'
import { OBJECT_DIFF_EVENTS } from '../enums'
import { tObjectDiffReturn } from '../types'

export const isExplorableObject = (value: unknown) => {
  const isObjectType = typeof value === 'object'
  const childIsNotNull = value != null
  const isDate = value instanceof Date

  return isObjectType && childIsNotNull && !isDate
}

export const tryParseDate = (value: string | Date | undefined) => {
  if (value === undefined) return undefined

  try {
    return format(new Date(value), `${dateString} HH:mm:ss`)
  } catch {
    return null
  }
}

export const checkIfDate = (value: unknown) => {
  const isInstanceOfDate = value instanceof Date
  const isValidDate = isValid(value)

  return isInstanceOfDate && isValidDate
}

export const areArrayEquals = (array1: unknown[], array2: unknown[]):boolean => {
  if (array1.length !== array2.length) return false

  // orders matter (for us)!
  for (let i = 0; i < array1.length; i++) {
    // We now use lodash for time contraints - it will be nice to (someday)
    // re-implement this in vanilla js to make this functions super reusable
    const element1 = array1[i]
    const element2 = array2[i]

    // XXX lodash, for some reason, implemented "isEqual" in a weird way.
    // Comparing anything with anything works correctly, unless its primitives:
    // isEquals([1],[1]) -> true
    // isEquals([1],[2]) -> false
    // isEquals({s:1},{s:2}) -> false
    // isEquals({s:1},{s:1}) -> true
    // isEquals({s:1},1) -> false
    // isEquals(1,1) -> false -> WHY!!!
    // That's why we don't use isEqual also here and made this check
    if (Array.isArray(element1) && Array.isArray(element2))
      return areArrayEquals(element1, element2)

    const element1isExplorable = isExplorableObject(element1)
    const element2isExplorable = isExplorableObject(element2)

    let elementEquals
    if (element1isExplorable || element2isExplorable)
      elementEquals = isEqual(element1, element2)
    else
      elementEquals = element1 === element2

    if (!elementEquals)
      return false
  }

  return true
}

// TODO: future note, is will be nice to add a "maxDepth" param to this
// function, to limit the depth of the diff
export const getObjectsDiff = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  returnObj: tObjectDiffReturn,
  currentPath: string = ''
) => {
  const obj1Keys = Object.keys(obj1)
  const obj2Keys = Object.keys(obj2)

  const combinedKeys = new Set([...obj1Keys, ...obj2Keys])
  const combinedArray = [...combinedKeys]

  for (const currentKey of combinedArray) {
    const obj1HasPath = obj1Keys.includes(currentKey)
    const obj2HasPath = obj2Keys.includes(currentKey)

    const isRoot = currentPath === ''
    const updatedPath = isRoot ? currentKey : `${currentPath}.${currentKey}`

    const obj1Value = obj1[currentKey]
    const obj2Value = obj2[currentKey]

    if (obj1HasPath && !obj2HasPath) {
      returnObj[updatedPath] = {
        type: OBJECT_DIFF_EVENTS.DELETED,
        valueBefore: obj1Value
      }

      continue
    }

    if (!obj1HasPath && obj2HasPath) {
      returnObj[updatedPath] = {
        type: OBJECT_DIFF_EVENTS.CREATED,
        valueAfter: obj2Value
      }

      continue
    }

    const bothArrays = Array.isArray(obj1Value) && Array.isArray(obj2Value)
    const obj1IsExplorable = isExplorableObject(obj1Value)
    const obj2IsExplorable = isExplorableObject(obj2Value)
    const oneOrBothLeaves = !obj1IsExplorable || !obj2IsExplorable

    if (bothArrays || oneOrBothLeaves) {
      let valueChanged = false
      if (bothArrays) {
        valueChanged = !areArrayEquals(obj1Value, obj2Value)
      } else {
        const isNewDate = checkIfDate(obj1Value)
        const isOldDate = checkIfDate(obj2Value)

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
          // @ts-expect-error ts is wrong
          parsedOldValue = tryParseDate(obj1Value)
          // @ts-expect-error ts is wrong
          parsedNewValue = tryParseDate(obj2Value)
        } else {
          parsedOldValue = obj1Value
          parsedNewValue = obj2Value
        }

        valueChanged = parsedOldValue !== parsedNewValue
      }

      if (valueChanged)
        returnObj[updatedPath] = {
          type: OBJECT_DIFF_EVENTS.UPDATED,
          valueBefore: obj1Value,
          valueAfter: obj2Value
        }

      continue
    }

    getObjectsDiff(
      obj1Value as Record<string, unknown>,
      obj2Value as Record<string, unknown>,
      returnObj,
      updatedPath
    )
  }

  return returnObj
}
