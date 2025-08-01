import {
  tField,
  tFieldRepresentation,
  tDependencyGraphNode,
  DEPENDENCY_NODE_STATUS,
  processNode,
  replaceDepsFunForFE,
  parseTarget,
  TARGET_TYPES,
  tTargetableEntities,
  tScope,
  tEntityUpdateFunc,
  tDependenciesReplacementMap,
  tImportedEventsPayload,
  tValidEventName,
  eventConversionFuncForBE,
  parseEventIntoDependencies,
  getAffectedNodes,
  tMarkAsDirtyPayload,
  DATA_PATH,
  FIELDS_PATH,
  REPRESENTATION_PATH,
  pathMatchesPattern,
} from '@smambu/lib.constants'
import { useExecuteQuery, useEvaluateNamedExpression } from 'hooks/urHooks/expressionHooks'
import { useState, useEffect, useRef } from 'react'
import { tData, tFrontendPayload, tParsedValues, tUpdatePayload } from 'universal-reporting/types'
import { entityDepReplamentMap } from 'universal-reporting/utils/entityDepsReplacementMap'
import { createFrontendEntityUpdateFunctionsMap } from 'universal-reporting/utils/frontendEntityUpdateFunctionsMap'
import { processFieldsAndRepresentations } from 'universal-reporting/utils/processFieldsAndRepresentations'
import { entityToScopeMap } from 'universal-reporting/utils/entityToScopeMap'

import { processUpdate } from 'universal-reporting/utils/utils'
import _ from 'lodash'
import { tEvaluatedField, tEvaluatedFieldRepresentation } from 'universal-reporting/types/tEvaluatedTypes'

export const useNodesProcessor = (
  fields: tField[],
  representations: tFieldRepresentation[],
  data: tData,
  setData: (data: tData) => void,
  debug: boolean
) => {
  const executeQuery = useExecuteQuery()
  const evaluateNamedExpression = useEvaluateNamedExpression()
  const [nodes, setNodes] = useState<tDependencyGraphNode[]>([])
  const [values, setValues] = useState<tParsedValues>({
    [DATA_PATH]: {},
    [FIELDS_PATH]: [],
    [REPRESENTATION_PATH]: [],
  })

  const loopProtection = useRef(0)

  const generateImportedEvent = (source: tValidEventName, path: string): tImportedEventsPayload => {
    const metadata = {}
    const previousValues = {}
    const currentValues = {}

    const event: tImportedEventsPayload = {
      currentValues,
      source,
      sourceDocId: `${path}`,
      previousValues,
      tenantId: 'frontend',
      metadata,
    }

    return event
  }

  const updateData = (data: { path: string; value: any }) => {
    if (debug)
      // eslint-disable-next-line no-console
      console.log('####UPDATE DATA', data)

    const newValues = structuredClone(values)
    _.set(newValues.data, data.path, data.value)

    const event = generateImportedEvent('data-updated', data.path)

    const { nodes: nodesToMarkAsDirty, dirtyReason } = getNodesToMarkAsDirty(event, nodes)
    const newNodes = markAsDirty(nodes, nodesToMarkAsDirty, dirtyReason)

    processNodes(newNodes, newValues)
  }

  const processNodes = async (inputNodes: tDependencyGraphNode[], inputValues: tParsedValues) => {
    if (loopProtection.current > 50)
      throw Error('Loop protection triggered')

    loopProtection.current++

    const newValues = inputValues ?? structuredClone(values)
    const nodesToProcess = findNodesToProcess(inputNodes)
    const entity: tFrontendPayload = createFrontEndScope(newValues)
    const affectedNodes: Record<string, { payload: tMarkAsDirtyPayload[], dirtyReason: string[] }> =
    {}

    const updateNodeFun = async (node: Partial<tDependencyGraphNode>) => {
      try {
        const originalNodeIndex = inputNodes.findIndex(n => n.target === node.target)
        if (originalNodeIndex === -1) throw Error(`Node ${node.target} not found`)

        const newNode: tDependencyGraphNode = { ...inputNodes[originalNodeIndex], ...node }
        inputNodes[originalNodeIndex] = newNode
      } catch (e) {
        console.error(e)
        throw e
      }
    }

    const updateValues = (updates: tUpdatePayload[]) => {
      updates.forEach(({ path, value }) => {
        processUpdate(newValues, path, value)
      })
    }

    for (const node of nodesToProcess) {
      const target = parseTarget(node.target)
      if (target.type === TARGET_TYPES.NOT_VALID) throw Error(`Target ${node.target} is not valid`)

      const scopeEntity: tTargetableEntities = target.entity as tTargetableEntities
      const scope: tScope = entityToScopeMap[scopeEntity](entity, node)
      const entityUpdateFunctionsMap: Record<string, tEntityUpdateFunc> =
        createFrontendEntityUpdateFunctionsMap(updateValues)

      const replacementMap: tDependenciesReplacementMap = entityDepReplamentMap[scopeEntity](
        node,
        entity
      )

      const { updates } = await processNode(
        node,
        scope,
        executeQuery,
        evaluateNamedExpression,
        updateNodeFun,
        entity,
        replacementMap,
        replaceDepsFunForFE
      )

      const events: tImportedEventsPayload[] = []
      if (Object.keys(updates.updatesMap).length > 0) {
        const updateFunc = entityUpdateFunctionsMap[updates.targetEntity]
        Object.keys(updates.updatesMap).forEach(key => {
          if (scopeEntity === DATA_PATH) {
            const newPath = key.startsWith(`${DATA_PATH}.`) ? key.slice(5) : key
            events.push(generateImportedEvent(
              `${scopeEntity}-updated` as tValidEventName,
              `${newPath}`
            ))
          } else {
            const numberEndingRegex = /^(.+)\.(\d+)$/
            const match = numberEndingRegex.exec(key)

            if (match) {
              const pathWithoutNumber = match[1]
              events.push(generateImportedEvent(
                `${scopeEntity}-updated` as tValidEventName,
                `{${target.id}}.${pathWithoutNumber}`
              ))
            }
            events.push(generateImportedEvent(
              `${scopeEntity}-updated` as tValidEventName,
              `{${target.id}}.${key}`
            ))
          }
        })

        updateFunc(updates.id, updates.updatesMap)
      }

      events.forEach(event => {
        const { nodes: nodesToMarkAsDirty, dirtyReason } = getNodesToMarkAsDirty(event, inputNodes)
        nodesToMarkAsDirty.forEach(dirtyPayload => {
          if (!affectedNodes[dirtyPayload.target])
            affectedNodes[dirtyPayload.target] = { payload: [], dirtyReason: [] }

          affectedNodes[dirtyPayload.target].payload.push(dirtyPayload)
          affectedNodes[dirtyPayload.target].dirtyReason.push(...dirtyReason)
        })
      })
    }

    if (Object.keys(affectedNodes).length > 0) {
      for (const key in affectedNodes) {
        const curr = affectedNodes[key]
        const newNodes = markAsDirty(inputNodes, curr.payload, curr.dirtyReason)
        processNodes(newNodes, newValues)
      }
    } else {
      setNodes(inputNodes)
      setValues(newValues)
      setData(newValues.data)
      loopProtection.current = 0
    }
  }

  useEffect(() => {
    const newValues = {
      [DATA_PATH]: data,
      [FIELDS_PATH]: fields as unknown as tEvaluatedField[],
      [REPRESENTATION_PATH]: representations as unknown as tEvaluatedFieldRepresentation[],
    }
    const createProcNodes = (values: tParsedValues) => {
      return async (nodes: tDependencyGraphNode[]) => {
        await processNodes(nodes, values)
      }
    }
    const procNodes = createProcNodes(newValues)

    processFieldsAndRepresentations(fields, representations, procNodes)
  }, [fields, representations])

  return { nodes, values, updateData }
}

const createFrontEndScope = (values: tParsedValues) => {
  return {
    [DATA_PATH]: values.data,
    [FIELDS_PATH]: values.fields,
    [REPRESENTATION_PATH]: values.representation,
  }
}

const findNodesToProcess = (nodes: tDependencyGraphNode[]) => {
  return nodes.filter(node => node.status === DEPENDENCY_NODE_STATUS.DIRTY)
}

const getDependentNodes = (dependencyPaths: string[], nodes: tDependencyGraphNode[]) => {
  const nodesToProcess = nodes.filter(node => {
    const allNodeDeps = [
      ...node.expressionDeps,
      ...(node.conditionDeps ?? []),
      ...(node.childDeps ?? [])
    ]
    return dependencyPaths.some(incomingPath =>
      allNodeDeps.some(nodeDepPattern => pathMatchesPattern(incomingPath, nodeDepPattern)))
  })

  return nodesToProcess
}
const getNodesToMarkAsDirty = (
  event: tImportedEventsPayload,
  inputNodes: tDependencyGraphNode[]
) => {
  const parsedDeps = parseEventIntoDependencies(event, eventConversionFuncForBE)

  const nodesToProcess = getDependentNodes(parsedDeps, inputNodes)

  const affectedNodes =
    getAffectedNodes(nodesToProcess, parsedDeps, event.previousValues, event.currentValues)

  return {
    nodes: affectedNodes,
    dirtyReason: parsedDeps
  }
}

const markAsDirty = (
  inputNodes: tDependencyGraphNode[],
  affectedNodes: tMarkAsDirtyPayload[],
  dirtyReason: string[]
) => {
  const newNodes = inputNodes.map(node => {
    const affectedNode = affectedNodes.find(n => n.target === node.target)
    if (affectedNode) return { ...node, status: DEPENDENCY_NODE_STATUS.DIRTY, dirtyReason }

    return node
  })

  return newNodes
}
