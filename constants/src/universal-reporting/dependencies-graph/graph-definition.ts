import {
  CHANGING_AGENTS,
  DEPENDENCY_NODE_STATUS,
  TARGET_TYPES,
  tCondition,
  tDependencyGraph,
  tDependencyGraphNode,
  tExpression,
  tHorizontalMergingPolicies,
  tNodeMetadata,
  tVerticalMergingPolicies,
} from '../../types'
import { getEntityQualificator } from './entities'
import { parseTarget } from './targets'

export async function emitFieldOnGraph (
  target: string,
  definitionDeps: string[],
  expression: tExpression | null,
  version: string,
  condition: tCondition | null,
  mergePolicy: {
    horizontal: tHorizontalMergingPolicies,
    vertical: tVerticalMergingPolicies,
  },
  tenantId: string,
  emitFun: (node: tDependencyGraphNode) => Promise<void>,
  subNodesDefinitions: tDependencyGraph,
) {
  const entity = getEntityQualificator(target)

  const defaultMetadata: tNodeMetadata = {
    currentValue: null,
    automaticValue: null,
    source: CHANGING_AGENTS.SYSTEM
  }

  const newGraphNode: tDependencyGraphNode = {
    target,
    entity,
    definitionDeps,
    expression,
    expressionDeps: getFixedDependencies(target, subNodesDefinitions),
    expressionDepsDetails: {},
    status: DEPENDENCY_NODE_STATUS.DIRTY,
    version,
    condition,
    conditionDeps: [],
    conditionDepsDetail: {},
    lastConditionValue: null,
    policy: mergePolicy,
    tenantId,
    subNodes: [],
    subNodesDefinitions,
    childDeps: [],
    metadata: defaultMetadata
  }

  await emitFun(newGraphNode)
}

export const getFixedDependencies = (target:string, subNodesDefinitions: tDependencyGraph) => {
  if (subNodesDefinitions.length > 0) {
    const parsedTarget = parseTarget(target)

    if (parsedTarget.type === TARGET_TYPES.NOT_VALID)
      throw Error(`Target ${parsedTarget.type} not valid`)

    return [`${parsedTarget.rest}.*`]
  }

  return []
}

export async function updateFieldOnGraph (
  target: string,
  expression: tExpression | null,
  version: string,
  condition: tCondition | null,
  mergePolicy: {
    horizontal: tHorizontalMergingPolicies,
    vertical: tVerticalMergingPolicies,
  },
  tenantId: string,
  updateFun: (node: Partial<tDependencyGraphNode>) => Promise<void>
) {
  const updatedGraphNode: Partial<tDependencyGraphNode> = {
    target,
    expression,
    status: DEPENDENCY_NODE_STATUS.DIRTY,
    version,
    condition,
    lastConditionValue: null,
    policy: mergePolicy,
    tenantId,
  }

  await updateFun(updatedGraphNode)
}
