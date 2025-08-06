import { tDependencyGraphNode, tScope, tExecuteQuery, tEvaluateNamedExpression, tUpdateNodeFun, tDependenciesReplacementMap, tDependenciesReplacementFun, tDependencyNodeStatus, DEPENDENCY_NODE_STATUS, tDependencyMap, tExpressionResult, tDependencyGraph, tUpdateTargetPayload, tExpression, tCondition } from '../../types'
import { emitsArrayToDependencyMap, getUniqueDependencyPaths } from './dependencies'
import { getFixedDependencies } from './graph-definition'
import { EvaluateBypassDependencies } from './misc'
import { getTargetValue, updateTargetValue } from './targets'
import { cloneDeep } from 'lodash'
import { pathMatchesPattern } from '../../utils'

type tParentChildUpdates = {
  parent: tUpdateTargetPayload;
  children?: tUpdateTargetPayload[]
}

async function evaluateAndExtractDeps<T = unknown> (
  expression: tExpression | tCondition,
  scope: tScope,
  executeQuery: tExecuteQuery,
  evaluateNamedExpression: tEvaluateNamedExpression,
  replacementMap: tDependenciesReplacementMap,
  replaceDepsFunc: tDependenciesReplacementFun
) {
  const evaluated = await EvaluateBypassDependencies(
    expression,
    scope,
    executeQuery,
    evaluateNamedExpression
  )

  const deps = getUniqueDependencyPaths(
    evaluated.emits,
    replacementMap,
    replaceDepsFunc
  )
  const depMap = emitsArrayToDependencyMap(
    evaluated.emits,
    replacementMap,
    replaceDepsFunc
  )

  return { evaluated: evaluated as tExpressionResult<T>, deps, depMap }
}

async function updateNodeTarget (
  node: tDependencyGraphNode,
  entity: Record<string, unknown>,
  nodeHasCondition: boolean,
  lastConditionValue: boolean | null,
  nodeHasExpression: boolean,
  evaluatedExpression: tExpressionResult<unknown> | undefined,
  subNodesDeps: string[],
  expressionDeps: string[]
) {
  const dirtyReasonMatchSubNodeDependencies =
    node.dirtyReason?.some(reason => subNodesDeps.some(
      dep => pathMatchesPattern(reason, dep)
    )) ?? false

  const dirtyReasonEqualsToTarget =
    node.dirtyReason?.some(reason => node.target.endsWith(reason)) ?? false

  const dirtyReasonMatchExpressionDeps = node.dirtyReason?.length && node.dirtyReason.length > 0
    ? node.dirtyReason?.some(reason => expressionDeps.some(
      dep => pathMatchesPattern(reason, dep)
    ))
    : true

  const parentTarget = node.target.split('.').slice(0, -1)
    .join('.')

  const longestDirtyReasons = node.dirtyReason && node.dirtyReason.length > 0
    ? node.dirtyReason?.reduce((longest, reason) =>
      reason.length >= longest[0].length ? [...longest, reason] : longest,
    [node.dirtyReason[0]])
    : []

  const parentChanged = longestDirtyReasons?.some(reason => parentTarget.endsWith(reason)) ?? false

  let nodeNeedsUpdating =
    (!nodeHasCondition || lastConditionValue === true) &&
    nodeHasExpression &&
    ((!dirtyReasonMatchSubNodeDependencies &&
    !dirtyReasonEqualsToTarget) &&
    (dirtyReasonMatchExpressionDeps || parentChanged))

  const mergePolicy = node.policy || {
    horizontal: 'OVERWRITE',
    vertical: 'PARENT'
  }

  const targetValue = nodeNeedsUpdating ? evaluatedExpression?.value : null
  return await updateTargetValue(
    node.target,
    targetValue,
    entity,
    mergePolicy,
    nodeNeedsUpdating
  )
}

async function handleSubNodes (
  node: tDependencyGraphNode,
  scope: tScope,
  executeQuery: tExecuteQuery,
  evaluateNamedExpression: tEvaluateNamedExpression,
  updateNodeFun: tUpdateNodeFun,
  entity: Record<string, unknown>,
  replacementMap: tDependenciesReplacementMap,
  replaceDepsFunc: tDependenciesReplacementFun
) {
  if (node.subNodesDefinitions.length === 0) return { updates: [], deps: [] }

  const newNode = cloneDeep(node)
  const match = newNode.target.match(/\.(\d+)$/)
  if (match) {
    const index = parseInt(match[1], 10)
    newNode.subNodesDefinitions = newNode.subNodesDefinitions.map(def => ({
      ...def,
      target: createNewTargetFromDefinition(def.target, index)
    }))
  }

  const subNodes = await processSubNodesDefinitions(
    newNode.subNodesDefinitions,
    newNode.target,
    entity,
    node.dirtyReason ?? []
  )

  newNode.subNodes = subNodes
  const { updates: subNodesUpdates, deps: subNodesDeps } = await processSubNodes(
    newNode,
    scope,
    executeQuery,
    evaluateNamedExpression,
    updateNodeFun,
    entity,
    replacementMap,
    replaceDepsFunc
  )
  return { updates: subNodesUpdates, deps: subNodesDeps }
}

export async function processNode (node: tDependencyGraphNode,
  scope: tScope,
  executeQuery: tExecuteQuery,
  evaluateNamedExpression: tEvaluateNamedExpression,
  updateNodeFun: tUpdateNodeFun,
  entity: Record<string, unknown>,
  replacementMap: tDependenciesReplacementMap,
  replaceDepsFunc: tDependenciesReplacementFun) {
  let status:tDependencyNodeStatus = DEPENDENCY_NODE_STATUS.OK
  let expressionErrors

  let lastConditionValue = node.lastConditionValue

  let conditionExpressionErrors

  let conditionDeps:string[] = []
  let conditionDependencyMap:tDependencyMap = {}

  let evaluatedExpression: tExpressionResult<unknown> | undefined
  const fixedDeps = getFixedDependencies(node.target, node.subNodesDefinitions)
  let expressionDeps: string[] = []
  let expressionDependencyMap:tDependencyMap = {}

  const nodeHasCondition = node.condition != null
  const nodeHasExpression = node.expression != null

  if (node.expression != null) {
    const { evaluated, deps, depMap } = await evaluateAndExtractDeps(
      node.expression,
      scope,
      executeQuery,
      evaluateNamedExpression,
      replacementMap,
      replaceDepsFunc
    )
    evaluatedExpression = evaluated

    expressionDeps = Array.from(
      new Set([...deps, ...expressionDeps])
    )
    expressionDependencyMap = depMap

    if (evaluatedExpression.error != null) {
      status = DEPENDENCY_NODE_STATUS.ERROR_EXPRESSION
      expressionErrors = evaluatedExpression.error
    }
  }

  if (node.condition != null) {
    const { evaluated: evaluatedCondition, deps, depMap } = await evaluateAndExtractDeps<boolean>(
      node.condition,
      scope,
      executeQuery,
      evaluateNamedExpression,
      replacementMap,
      replaceDepsFunc
    )

    conditionDeps = deps
    conditionDependencyMap = depMap

    if (evaluatedCondition.error != null) {
      status = DEPENDENCY_NODE_STATUS.ERROR_CONDITION
      conditionExpressionErrors = evaluatedCondition.error
    } else {
      // XXX We update the last condition value only if the expression gets
      // correcly evaluated, otherwise we are saving wrong information
      lastConditionValue = evaluatedCondition.value
    }
  }

  const parentUpdate = await updateNodeTarget(
    node,
    entity,
    nodeHasCondition,
    lastConditionValue,
    nodeHasExpression,
    evaluatedExpression,
    fixedDeps,
    expressionDeps,
  )

  const updates: tParentChildUpdates = { parent: parentUpdate }

  const { updates: subNodesUpdates, deps: subNodesDeps } = await handleSubNodes(
    node,
    scope,
    executeQuery,
    evaluateNamedExpression,
    updateNodeFun,
    entity,
    replacementMap,
    replaceDepsFunc
  )

  updates.children = subNodesUpdates

  const nodeUpdated:Partial<tDependencyGraphNode> = {
    target: node.target,
    tenantId: node.tenantId,
    expressionDeps,
    expressionDepsDetails: expressionDependencyMap,
    conditionDeps,
    conditionDepsDetail: conditionDependencyMap,
    lastConditionValue,
    expressionErrors,
    conditionExpressionErrors,
    status,
    childDeps: Array.from(new Set([...subNodesDeps, ...fixedDeps]))
  }

  await updateNodeFun(nodeUpdated)
  const result = mergeUpdates(updates)

  const nodeDeps = Array.from(new Set([...expressionDeps, ...subNodesDeps]))

  return { updates: result, deps: nodeDeps }
}

const processSubNodesDefinitions = async (
  subNodesDefinitions: tDependencyGraphNode[],
  target: string,
  entity: Record<string, unknown>,
  dirtyReason: string[]
) => {
  const { actualTarget } = getTargetValue(entity, target)

  const newSubNodes: tDependencyGraph = []
  if (Array.isArray(actualTarget))
    for (const [index, _item] of actualTarget.entries())
      for (const subNode of subNodesDefinitions) {
        const newTarget = createNewTargetFromDefinition(subNode.target, index)
        const newSubNode = { ...subNode, target: newTarget, dirtyReason }
        newSubNodes.push(newSubNode)
      }
  else
    if (!target.includes('[]'))
      for (const subNode of subNodesDefinitions)
        newSubNodes.push(cloneDeep({ ...subNode, dirtyReason }))

  return newSubNodes
}

const createNewTargetFromDefinition = (definitionTarget: string, index: number) => definitionTarget.replace(/(\.\[\]\.)|(\.\[\])/, (match: string, fullMatchWithDot: string, fullMatchWithoutDot: string) => {
  if (fullMatchWithDot)
    return `.${index}.`

  else if (fullMatchWithoutDot)
    return `.${index}`

  return match
})

const processSubNodes = async (
  node: tDependencyGraphNode,
  scope: tScope,
  executeQuery: tExecuteQuery,
  evaluateNamedExpression: tEvaluateNamedExpression,
  updateNodeFun: tUpdateNodeFun,
  entity: Record<string, unknown>,
  replacementMap: tDependenciesReplacementMap,
  replaceDepsFunc: tDependenciesReplacementFun

) => {
  const updateSubNodeFun = async (
    newSubNode: Partial<tDependencyGraphNode>
  ) => {
    const newSubNodes = node.subNodes.map(
      n => n.target === newSubNode.target ? { ...n, ...newSubNode } : n
    )
    node.subNodes = newSubNodes
  }

  let updates: tUpdateTargetPayload[] = []
  let childDeps: string[] = []
  for (const subNode of node.subNodes) {
    const { updates: nodeUpdates, deps } = await processNode(
      subNode,
      scope,
      executeQuery,
      evaluateNamedExpression,
      updateSubNodeFun,
      entity,
      replacementMap,
      replaceDepsFunc
    )
    if (nodeUpdates)
      updates.push(nodeUpdates)
    childDeps.push(...deps)
  }

  await updateNodeFun(node)
  return { updates, deps: Array.from(new Set([...childDeps])) }
}

const mergeUpdates = (updates: tParentChildUpdates): tUpdateTargetPayload => {
  const result: tUpdateTargetPayload = updates.parent

  const childrenUpdates = updates.children ?? []
  for (const child of childrenUpdates)
    Object.entries(child.updatesMap).forEach(([key, value]) => {
      if (child.mergePolicy.vertical === 'CHILD' || result.updatesMap[key] == null)
        result.updatesMap[key] = value
    })

  return result
}
