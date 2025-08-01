import { isEqual, isArray, isObject } from 'lodash'
import { auditTrailProtectedFields } from '../constants'
import { anagraphicsTypes, getAnagraphicFields, getAnagraphicKeysIndex } from '../enums'
import { IAnagraphicDataVersion, IAnagraphicSetup } from '../types/anagraphics'

const stringifyValue = (key: string, value: unknown) => {
  if (auditTrailProtectedFields.includes(key)) return String('*********')

  if (typeof value === 'object') return JSON.stringify(value)

  return String(value ?? '')
}

const areNotEqual = (prev: any, next: any) => {
  if ((prev === null || prev === undefined || prev === '') && (next === null || next === undefined || next === '')) return false
  return prev !== next
}

const checkIfObjects = (prev: any, next: any) =>
  (isObject(prev) && isObject(next)) ||
  (isObject(prev) && next == null) ||
  (prev == null && isObject(next))

export function getDifferencesArray (origObj: unknown, newObj: any):
{ key: string, previousValue: any, newValue: any }[] {
  const listDifferences = (prevObj: any, newObj: any, route = '') => {
    let differences = {} as Record<string, { key: string, previousValue: any, newValue: any }>
    Object.keys({
      ...prevObj,
      ...newObj,
    }).forEach(key => {
      if (isArray(prevObj[key]) && isArray(newObj[key])) {
        if (!isEqual(prevObj[key], newObj[key]))
          differences[`${route}${key}`] = {
            key: `${route}${key}`,
            previousValue: stringifyValue(key, prevObj[key]),
            newValue: stringifyValue(key, newObj[key]),
          }
      } else if (checkIfObjects(prevObj[key], newObj[key])) {
        differences = {
          ...differences,
          ...listDifferences(prevObj[key] ?? {}, newObj[key] ?? {}, `${route}${key}.`),
        }
      } else if (newObj[key] !== prevObj[key]) {
        if (!differences[`${route}${key}`] && areNotEqual(prevObj[key], newObj[key]))
          differences[`${route}${key}`] = {
            key: `${route}${key}`,
            previousValue: stringifyValue(key, prevObj[key]),
            newValue: stringifyValue(key, newObj[key]),
          }
      }
    })
    return differences
  }

  return Object.values(listDifferences(origObj, newObj))
}

export const getAnagraphicVersionsDifferencesArrays = (
  anagraphicSetup: IAnagraphicSetup,
  prevObj: IAnagraphicDataVersion,
  newObj: IAnagraphicDataVersion
) => {
  const subType = prevObj?.subType ?? newObj?.subType
  // TODO UR: check this
  const anagraphicKeysIndex = getAnagraphicKeysIndex(anagraphicSetup, subType as anagraphicsTypes)
  const anagraphicFields = getAnagraphicFields(anagraphicSetup, subType as anagraphicsTypes)

  const prevRows = prevObj?.rows ?? []
  const newRows = newObj?.rows ?? []

  const checkedKeys = [] as string[]

  const differences: { key: string, previousValue: any, newValue: any }[] = [
    ...(prevObj?.fromDate !== newObj?.fromDate
      ? [{
        key: 'fromDate',
        previousValue: prevObj?.fromDate,
        newValue: newObj?.fromDate,
      }]
      : []),
    ...prevRows.reduce((acc: any, prevRow: any) => {
      const key = anagraphicKeysIndex.map((index: number) => prevRow[index]).join('')
      checkedKeys.push(key)
      const newRow = newRows.find((row: any) => anagraphicKeysIndex.map((index: number) => row[index]).join('') === key)

      const rowDifferences = prevRow.reduce((acc: any, prevValue: any, index: number) => {
        const field = anagraphicFields[index]
        const newValue = newRow?.[index] ?? null

        if (prevValue !== newValue && !field.readonly)
          acc.push({
            key: `rows.${key}.${field.name}`,
            previousValue: prevValue,
            newValue,
          })
        return acc
      }, [] as { key: string, previousValue: any, newValue: any }[])

      acc.push(...rowDifferences)
      return acc
    }, [] as { key: string, previousValue: any, newValue: any }[]),
    ...newRows.reduce((acc: any, newRow: any) => {
      const key = anagraphicKeysIndex.map(index => newRow[index]).join('')
      if (checkedKeys.includes(key)) return acc

      const rowDifferences = newRow.reduce((acc: any, newValue: any, index: number) => {
        const field = anagraphicFields[index]

        if (newValue !== null && !field.readonly)
          acc.push({
            key: `rows.${key}.${field.name}`,
            previousValue: null,
            newValue,
          })
        return acc
      }, [] as { key: string, previousValue: any, newValue: any }[])

      acc.push(...rowDifferences)
      return acc
    }, [] as { key: string, previousValue: any, newValue: any }[]),
  ]

  return differences
}
