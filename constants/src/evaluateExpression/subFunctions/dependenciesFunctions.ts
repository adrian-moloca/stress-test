import { tDependentValue, tDeps, tEmissions, tEmits, tExpressionResult } from '../../types'
import { isValid } from 'date-fns'
import { isEqual } from 'lodash'
import { Document, RootFilterQuery } from 'mongoose'

export const getNewDeps = (newDeps?: tDeps | null): tDeps =>
  newDeps ?? []

export const getNewEmits = (newEmits?: tEmits | null): tEmits =>
  newEmits ?? []

export const getNewEmissions = (newDeps?: tDeps): tEmissions => ({
  deps: getNewDeps(newDeps),
  emits: getNewEmits(),
})

// Valid arg: { value: any | null | undefined, deps: tDeps, emits: tEmits }
export const isDependentValue = (arg: unknown): arg is tDependentValue => {
  if (arg == null || typeof arg !== 'object') return false

  // Value can be null or undefined, but deps and emits are required
  const obj = arg as Record<string, unknown>
  const hasDeps = obj.deps !== undefined && Array.isArray(obj.deps)
  const hasEmits = obj.emits !== undefined && Array.isArray(obj.emits)
  const hasDependentValue = hasDeps && hasEmits

  return hasDependentValue
}

export const joinEmits = (...args: (tEmits | null)[]): tEmits =>
  args.reduce((acc: tEmits, item) => {
    if (item == null || item.length === 0) return acc

    return item.reduce((acc, item) => {
      if (acc.some(dep => isEqual(dep, item))) return acc
      return [...acc, item]
    }, acc)
  }, [] as tEmits)

export const joinDeps = (...args: (tDeps | null)[]) =>
  args.filter(Boolean).flat() as tDeps

export const convertDepsToEmits = (deps: tDeps | null): tEmits =>
  deps ?? getNewEmits()

export const flatDependendValue = (item: tDependentValue | unknown): tExpressionResult => {
  if (isValid(item)) return { value: item, emits: getNewEmits() }

  if (isDependentValue(item)) {
    const result = flatDependendValue(item.value)
    return {
      value: result.value,
      emits: joinEmits(
        convertDepsToEmits(item.deps),
        item.emits,
        result.emits,
      ),
    }
  }

  if (Array.isArray(item)) {
    const results = [] as unknown[]
    const emits = getNewEmits()
    for (const value of item) {
      const result = flatDependendValue(value)
      results.push(result.value)
      emits.push(...result.emits)
    }
    return { value: results, emits }
  }

  if (typeof item === 'object' && item != null) {
    const entries = Object.entries(item)
    const results = {} as Record<string, unknown>
    const emits = getNewEmits()
    for (const [key, value] of entries) {
      const result = flatDependendValue(value)
      results[key] = result.value
      emits.push(...result.emits)
    }
    return { value: results, emits }
  }

  return { value: item, emits: getNewEmits() }
}

export const getValue = (value: tDependentValue | unknown): unknown =>
  isDependentValue(value) ? value.value : value

const getQueryPaths = (obj: RootFilterQuery<Document>): string[] => {
  const paths: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (isValid(value)) return []

    const isSpecialKey = typeof key === 'string' && key.startsWith('$')
    const basePath = isSpecialKey ? '' : key

    if (basePath === '') continue

    if (Array.isArray(value)) {
      if (value.length === 0) return []

      const subPaths = value.flatMap(item => getQueryPaths(item))
      const parsedSubPaths = subPaths.map(path => `${basePath}.${path}`)

      paths.push(...parsedSubPaths)
      continue
    }

    if (typeof value === 'object' && value !== null) {
      const subPaths = getQueryPaths(value)

      if (subPaths.length > 0) {
        const parsedSubPaths = subPaths.map(path => `${basePath}.${path}`)

        paths.push(...parsedSubPaths)
      } else {
        paths.push(basePath)
      }

      continue
    }

    paths.push(basePath)
  }

  return paths
}

export const formatExecuteQueryValue = <T>(
  label: string,
  query: RootFilterQuery<Document>,
  items: T[],
  getItemDeps: (item: T, index: number) => tDeps
) => {
  const mainStrings = getQueryPaths(query)
  const mainDeps = [
    { path: label, details: query },
    ...mainStrings.map(string => ({ path: `${label}.*.${string}`, details: query })),
  ]

  const newDeps = getNewDeps(mainDeps)
  const newEmits = getNewEmits()

  return ({
    value: items.map((item, index) => {
      const itemDeps = getItemDeps(item, index)
      const deps = getNewDeps(itemDeps)
      const emits = getNewEmits()

      return ({
        value: item,
        deps,
        emits,
      })
    }),
    deps: newDeps,
    emits: newEmits,
  })
}
