import { tTargetableEntities, tScope, tDependencyGraphNode } from '@smambu/lib.constants'
import { tFrontendPayload } from 'universal-reporting/types'
import { representationPathToField } from './representationPathToField'
import { representationNodeTargetToPayloadPath } from './representationNodeTargetToPayloadPath'

const defaultEntityToScopeMap = function (
  entity: tFrontendPayload,
  node: tDependencyGraphNode
): tScope {
  return { self: entity.data }
}

export const entityToScopeMap: Record<
  tTargetableEntities,
  (entity: tFrontendPayload, node: tDependencyGraphNode) => tScope
> = {
  fields: defaultEntityToScopeMap,
  representationstring: defaultEntityToScopeMap,
  representationnumber: defaultEntityToScopeMap,
  representationboolean: defaultEntityToScopeMap,
  representationobject: defaultEntityToScopeMap,
  representationdate: defaultEntityToScopeMap,
  representationdateWithoutTimestamp: defaultEntityToScopeMap,
  representationtimestamp: defaultEntityToScopeMap,
  representationemail: defaultEntityToScopeMap,
  representationprice: defaultEntityToScopeMap,
  representationuniqueId: defaultEntityToScopeMap,
  representationtextWithPattern: defaultEntityToScopeMap,
  representationpositiveNumber: defaultEntityToScopeMap,
  representationpositivePrice: defaultEntityToScopeMap,
  representationlocalizedText: defaultEntityToScopeMap,
  representationtwoDecimalNumber: defaultEntityToScopeMap,
  representationtable: defaultEntityToScopeMap,
  representationlist: defaultEntityToScopeMap,
  representationaccordion: defaultEntityToScopeMap,
  data: defaultEntityToScopeMap,
  representationenum: function (
    entity: tFrontendPayload,
    node: tDependencyGraphNode
  ): tScope {
    const fieldItemAndPath = representationPathToField(node.target, entity)

    const test = representationNodeTargetToPayloadPath(node.target, entity)

    const field = fieldItemAndPath.item

    if (field.type.kind !== 'enum')
      throw new Error(
        `Field ${node.target} resolved to ${fieldItemAndPath.path} is not an enum. test ${test}`
      )

    return { self: entity.data, options: field.type.options }
  },
  proxy: function (_entity: tFrontendPayload, _node: tDependencyGraphNode): tScope {
    // THIS MUST NEVER HAPPEN. this means JSON is badly configured or the backend is returning wrong data.
    throw new Error('PROXY ENTITY NOT SUPPORTED FRONTEND.')
  },
  case: function (_entity: tFrontendPayload, _node: tDependencyGraphNode): tScope {
    // THIS MUST NEVER HAPPEN. this means JSON is badly configured or the backend is returning wrong data.
    throw new Error('CASE ENTITY NOT SUPPORTED FRONTEND.')
  },
}
