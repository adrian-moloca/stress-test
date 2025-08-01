import {
  tExpression,
} from '../types'
import { isTViewItem } from './dependencies-graph'

const isTExpression = (obj: any): obj is tExpression =>
  obj && typeof obj === 'object' && 'expressionKind' in obj

export const findAllExpressionsPaths = (
  obj: any,
  path: string,
  visited: string[],
  targetMap: Record<string, {expression: tExpression, representationKind: string }>,
  representationKind: string
) => {
  if (obj === null || typeof obj !== 'object') return
  if (visited.includes(path)) return
  visited.push(path)

  let newRepresentationKind = representationKind
  if (isTViewItem(obj))
    newRepresentationKind = obj.viewAs.representationKind

  if (isTExpression(obj)) {
    targetMap[path] = { expression: obj, representationKind: newRepresentationKind }
    return
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newPath = path ? `${path}.${index}` : `${index}`
      findAllExpressionsPaths(item, newPath, visited, targetMap, newRepresentationKind)
    })
    return
  }

  for (const key in obj)
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newPath = path ? `${path}.${key}` : key
      findAllExpressionsPaths(obj[key], newPath, visited, targetMap, newRepresentationKind)
    }
}
