import {
  tDependencyGraphNode,
  parseTarget,
  TARGET_TYPES,
  tTargetableEntities,
} from '@smambu/lib.constants'
import { tFrontendPayload } from 'universal-reporting/types'
import { fieldPrefix } from './fieldsPrefix'
import { representationPathToField } from './representationPathToField'

const getDefaultEntityDepReplacementMap = (
  node: tDependencyGraphNode,
  entity: tFrontendPayload
): Record<string, string> => {
  return {}
}

export const entityDepReplamentMap: Record<
  tTargetableEntities,
  (node: tDependencyGraphNode, entity: tFrontendPayload) => Record<string, string>
> = {
  representationenum: (node: tDependencyGraphNode, entity: tFrontendPayload) => {
    const result: Record<string, string> = {}

    const target = parseTarget(node.target)
    if (target.type === TARGET_TYPES.NOT_VALID) throw Error(`Target ${node.target} is not valid`)
    const fieldItemAndPath = representationPathToField(node.target, entity)

    result['options'] = `${fieldPrefix(target.id)}.${fieldItemAndPath.path}${createFieldPrefix(fieldItemAndPath.path)}.type.options`

    return result
  },
  fields: getDefaultEntityDepReplacementMap,
  representationstring: getDefaultEntityDepReplacementMap,
  representationnumber: getDefaultEntityDepReplacementMap,
  representationboolean: getDefaultEntityDepReplacementMap,
  representationobject: getDefaultEntityDepReplacementMap,
  representationdate: getDefaultEntityDepReplacementMap,
  representationdateWithoutTimestamp: getDefaultEntityDepReplacementMap,
  representationtimestamp: getDefaultEntityDepReplacementMap,
  representationemail: getDefaultEntityDepReplacementMap,
  representationprice: getDefaultEntityDepReplacementMap,
  representationuniqueId: getDefaultEntityDepReplacementMap,
  representationtextWithPattern: getDefaultEntityDepReplacementMap,
  representationpositiveNumber: getDefaultEntityDepReplacementMap,
  representationpositivePrice: getDefaultEntityDepReplacementMap,
  representationlocalizedText: getDefaultEntityDepReplacementMap,
  representationtwoDecimalNumber: getDefaultEntityDepReplacementMap,
  representationtable: getDefaultEntityDepReplacementMap,
  representationlist: getDefaultEntityDepReplacementMap,
  representationaccordion: getDefaultEntityDepReplacementMap,
  data: getDefaultEntityDepReplacementMap,
  proxy: function (node: tDependencyGraphNode): Record<string, string> {
    throw new Error('PROXY ENTITY NOT SUPPORTED FRONTEND.')
  },
  case: function (node: tDependencyGraphNode): Record<string, string> {
    throw new Error('CASE ENTITY NOT SUPPORTED FRONTEND.')
  },
}

// in case of first level we need to add .definition
const createFieldPrefix = (path: string) => {
  const splitPath = path.split('.')
  if (splitPath.length === 1) return '.definition'
  return ''
}
