import { parseTarget, TARGET_TYPES, isTViewItem } from '@smambu/lib.constants'
import _ from 'lodash'
import { tFrontendPayload } from 'universal-reporting/types'

export const fieldNodeTargetToPayloadPath = (
  representationTarget: string,
  entity: tFrontendPayload
) => {
  const target = parseTarget(representationTarget)
  let currItem: any = entity
  let fieldPath = ''

  if (target.type === TARGET_TYPES.NOT_VALID)
    throw Error(`Target ${representationTarget} is not valid`)

  const path = parseAllItems(target.rest)

  while (path.length > 1) {
    // last element is an expression. heavily linked on implementation.
    // we just add nodes for representation that are expressions and also viewAs wants a tViewItem.
    const current = path.shift()

    if (current === undefined) throw Error('Current path is not valid')
    const value = _.get(currItem, current)

    if (!isTViewItem(value)) throw Error(`Value ${JSON.stringify(value)} is not a valid TViewItem`)

    fieldPath = fieldPath ? `${fieldPath}.${value.fieldId}` : value.fieldId

    currItem = value.viewAs
  }

  const expressionPath = path.shift()
  if (expressionPath === undefined) throw Error('Expression path is not valid')
  const lastPath = expressionPath.split('.')
  const isThereALastViewItem = lastPath.length > 1
  if (isThereALastViewItem) {
    const lastItemPath = findNextViewItem(lastPath, currItem)
    fieldPath = fieldPath !== '' ? `${fieldPath}.${lastItemPath}` : lastItemPath
  }

  if (fieldPath === '')
    throw new Error(`error while parsing the field path of ${representationTarget}`)

  return fieldPath
}

const parseAllItems = (path: string) => path.split('.viewAs.')

const findNextViewItem = (path: string[], item: any) => {
  while (path.length > 0) {
    const current = path.shift()
    if (current === undefined) throw Error('Current path is not valid')
    const value = _.get(item, current)
    if (isTViewItem(value)) return value.fieldId
    item = value
  }
  throw Error(`No viewItem found for path ${path}`)
}
