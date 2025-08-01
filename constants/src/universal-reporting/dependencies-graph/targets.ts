import { isObject } from 'lodash'
import { tTargetableEntities, TARGETABLE_ENTITIES, tParsedTarget, TARGET_TYPES, tHorizontalMergingPolicies, MERGING_POLICIES, tVerticalMergingPolicies } from '../../types'
import { setNestedValue, getNestedValue, isExplorableObject, isIgnoredField } from '../../utils'
import { DATA_PATH, DYNAMIC_DATA_PATH, DYNAMIC_FIELDS_PATH, FIELDS_PATH, REPRESENTATION_PATH } from '../constants'

export const getTarget = (entityType: tTargetableEntities, entityId: string, path: string) => {
  switch (entityType) {
    case TARGETABLE_ENTITIES.PROXY:
      return `${entityType}.{${entityId}}.${DYNAMIC_FIELDS_PATH}.${path}`

    case TARGETABLE_ENTITIES.CASE:
      return `${entityType}.{${entityId}}.${DYNAMIC_DATA_PATH}.${path}`

    case TARGETABLE_ENTITIES.FIELDS:
      return `${entityType}.{${entityId}}.${FIELDS_PATH}.${path}`

    case TARGETABLE_ENTITIES.REPRESENTATION_accordion:
    case TARGETABLE_ENTITIES.REPRESENTATION_enum:
    case TARGETABLE_ENTITIES.REPRESENTATION_list:
    case TARGETABLE_ENTITIES.REPRESENTATION_table:
    case TARGETABLE_ENTITIES.REPRESENTATION_price:
    case TARGETABLE_ENTITIES.REPRESENTATION_positivePrice:
    case TARGETABLE_ENTITIES.REPRESENTATION_positiveNumber:
    case TARGETABLE_ENTITIES.REPRESENTATION_twoDecimalNumber:
    case TARGETABLE_ENTITIES.REPRESENTATION_textWithPattern:
    case TARGETABLE_ENTITIES.REPRESENTATION_uniqueId:
    case TARGETABLE_ENTITIES.REPRESENTATION_email:
    case TARGETABLE_ENTITIES.REPRESENTATION_date:
    case TARGETABLE_ENTITIES.REPRESENTATION_dateWithoutTimestamp:
    case TARGETABLE_ENTITIES.REPRESENTATION_timestamp:
    case TARGETABLE_ENTITIES.REPRESENTATION_object:
    case TARGETABLE_ENTITIES.REPRESENTATION_boolean:
    case TARGETABLE_ENTITIES.REPRESENTATION_string:
    case TARGETABLE_ENTITIES.REPRESENTATION_number:
    case TARGETABLE_ENTITIES.REPRESENTATION_localizedText:
      return `${entityType}.{${entityId}}.${REPRESENTATION_PATH}.${path}`

    case TARGETABLE_ENTITIES.DATA:
      return `${entityType}.{${entityId}}.${DATA_PATH}.${path}`

    default:
      throw Error(`Target for entitites of type ${entityType} is not supported`)
  }
}

export function parseTarget (target: string): tParsedTarget {
  const entityRegex = /^([^.]+)\.\{(\w+)\}\.(.+)$/

  const match = target.match(entityRegex)

  if (match == null)
    return {
      type: TARGET_TYPES.NOT_VALID,
    }

  return {
    type: TARGET_TYPES.ENTITY,
    entity: match[1],
    id: match[2],
    rest: match[3],
  }
}

export function getUpdatedTargetValue (
  actualTargetValue: unknown,
  entityType: string,
  fieldValuePath: string,
  value: unknown,
  mergePolicy: {
    horizontal: tHorizontalMergingPolicies
    vertical: tVerticalMergingPolicies
  }
) {
  let newValue
  switch (entityType) {
    case TARGETABLE_ENTITIES.PROXY:
    case TARGETABLE_ENTITIES.CASE:
    case TARGETABLE_ENTITIES.DATA:
      newValue = {}
      switch (mergePolicy.horizontal) {
        case MERGING_POLICIES.OVERWRITE:
          setNestedValue(newValue, fieldValuePath, value)
          break

        case MERGING_POLICIES.SHY:
          if (actualTargetValue == null)
            setNestedValue(newValue, fieldValuePath, value)
          break

        default:
          throw Error(`Merge policy ${mergePolicy} is not supported`)
      }

      break

    case TARGETABLE_ENTITIES.FIELDS:
    case TARGETABLE_ENTITIES.REPRESENTATION_accordion:
    case TARGETABLE_ENTITIES.REPRESENTATION_enum:
    case TARGETABLE_ENTITIES.REPRESENTATION_list:
    case TARGETABLE_ENTITIES.REPRESENTATION_table:
    case TARGETABLE_ENTITIES.REPRESENTATION_price:
    case TARGETABLE_ENTITIES.REPRESENTATION_positivePrice:
    case TARGETABLE_ENTITIES.REPRESENTATION_positiveNumber:
    case TARGETABLE_ENTITIES.REPRESENTATION_twoDecimalNumber:
    case TARGETABLE_ENTITIES.REPRESENTATION_textWithPattern:
    case TARGETABLE_ENTITIES.REPRESENTATION_uniqueId:
    case TARGETABLE_ENTITIES.REPRESENTATION_email:
    case TARGETABLE_ENTITIES.REPRESENTATION_date:
    case TARGETABLE_ENTITIES.REPRESENTATION_dateWithoutTimestamp:
    case TARGETABLE_ENTITIES.REPRESENTATION_timestamp:
    case TARGETABLE_ENTITIES.REPRESENTATION_object:
    case TARGETABLE_ENTITIES.REPRESENTATION_boolean:
    case TARGETABLE_ENTITIES.REPRESENTATION_string:
    case TARGETABLE_ENTITIES.REPRESENTATION_number:
    case TARGETABLE_ENTITIES.REPRESENTATION_localizedText:
      newValue = {}
      setNestedValue(newValue, fieldValuePath, value)
      break

    default:
      throw Error(`Entity type ${entityType} is not supported`)
  }

  return newValue
}

export const getTargetValue = (entity: Record<string, unknown>, target: string) => {
  const parsedTarget = parseTarget(target)

  if (parsedTarget.type === TARGET_TYPES.NOT_VALID)
    throw Error(`Target ${parsedTarget.type} not valid`)

  const targetPath = parsedTarget.rest
  const targetEntity = parsedTarget.entity
  const actualTarget = getNestedValue(entity, targetPath)

  return { parsedTarget, actualTarget, targetEntity, targetPath }
}

export async function updateTargetValue (
  target: string,
  value: unknown,
  entity: Record<string, unknown>,
  mergePolicy: {
    horizontal: tHorizontalMergingPolicies;
    vertical: tVerticalMergingPolicies;
  },
  nodeNeedsUpdating: boolean
) {
  const { parsedTarget, actualTarget, targetEntity, targetPath } = getTargetValue(entity, target)

  if (nodeNeedsUpdating && (isObject(actualTarget) || actualTarget !== value)) {
    const updatedValue = getUpdatedTargetValue(
      actualTarget,
      targetEntity,
      targetPath,
      value,
      mergePolicy
    )

    const updatesMap = localFlattenObject(updatedValue)

    return { id: parsedTarget.id, updatesMap, targetEntity, mergePolicy }
  }

  return { id: parsedTarget.id, updatesMap: {}, targetEntity, mergePolicy }
}

// TODO: this is the replica of flattenObject from simultaneous.ts
// it's bugged !(inputObject[inputObject]) and !flatObject[x]
// they remove falsy values.
// i was told to duplicate it
const localFlattenObject = (inputObject: any) => {
  const returnObj: Record<string, unknown> = {}

  for (const currentField in inputObject) {
    if (!(currentField in inputObject) || isIgnoredField(currentField)) continue

    const canExplore = isExplorableObject(inputObject[currentField])
    if (canExplore) {
      let flatObject = localFlattenObject(inputObject[currentField])
      if (Object.keys(flatObject).length === 0)
        returnObj[currentField] = flatObject
      else
        for (let x in flatObject) {
          if (!(x in flatObject)) continue

          returnObj[currentField + '.' + x] = flatObject[x]
        }
    } else {
      returnObj[currentField] = inputObject[currentField]
    }
  }

  return returnObj
}
