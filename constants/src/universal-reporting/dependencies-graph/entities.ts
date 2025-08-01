import { TARGETABLE_ENTITIES, tParsedTarget, TARGET_TYPES, tParsedEntityTarget, tEntityRetrievalFunc } from '../../types'
import { parseTarget } from './targets'

export function getEntityQualificator (target: string) {
  const parsedTarget = parseTarget(target)

  if (parsedTarget.type === TARGET_TYPES.NOT_VALID)
    throw Error(`Target ${target} is not valid`)

  const { id, entity } = parsedTarget
  switch (parsedTarget.entity) {
    case TARGETABLE_ENTITIES.PROXY:
    case TARGETABLE_ENTITIES.CASE:
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
    case TARGETABLE_ENTITIES.DATA:
      return `${entity}.${id}`

    default:
      throw Error(`Target for entitites of type ${entity} is not supported`)
  }
}

export async function getParsedEntity (parsedTarget: tParsedTarget,
  entityFunctionsMap: Record<string, tEntityRetrievalFunc>) {
  const type = parsedTarget.type

  let actualTarget, id, entity
  let targetFunc
  switch (type) {
    case TARGET_TYPES.ENTITY:
      actualTarget = parsedTarget as tParsedEntityTarget
      entity = actualTarget.entity
      id = actualTarget.id

      targetFunc = entityFunctionsMap[entity]
      break

    case TARGET_TYPES.NOT_VALID:
    default:
      throw Error('Target not valid')
  }

  const result = await targetFunc(id)

  return result
}
