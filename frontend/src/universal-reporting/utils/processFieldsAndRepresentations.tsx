import {
  tFieldRepresentation,
  tDependencyGraphNode,
  tExpression,
  findAllExpressionsPaths,
  getTarget,
  emitFieldOnGraph,
  ALLOWED_DEFINITION_DEPS,
  MERGING_POLICIES,
  tField,
  tTargetableEntities,
  TARGETABLE_ENTITIES,
  VERTICAL_MERGING_POLICIES,
  tFieldDefinition,
} from '@smambu/lib.constants'

const createDependencyGraphNodeForRepresentation = async (
  representation: tFieldRepresentation,
  tenantId: string,
  proxyId: string,
  emitNode: (node: tDependencyGraphNode) => Promise<void>,
  index: number
) => {
  const targetMap: Record<string, {expression: tExpression, representationKind: string }> = {}
  findAllExpressionsPaths(representation, '', [], targetMap, 'REPRESENTATIONS')

  for (const [path, value] of Object.entries(targetMap)) {
    const { expression, representationKind } = value
    const target = getTarget(`representation${representationKind}` as tTargetableEntities, `${proxyId}`, `${index}.${path}`)
    await emitFieldOnGraph(
      target,
      [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
      expression,
      '1',
      null,
      { horizontal: MERGING_POLICIES.OVERWRITE, vertical: VERTICAL_MERGING_POLICIES.CHILD },
      tenantId,
      emitNode,
      []
    )
  }
}

const createDependencyGraphNodeForField = async (
  field: tField,
  tenantId: string,
  proxyId: string,
  emitNode: (node: tDependencyGraphNode) => Promise<void>,
  index: number
) => {
  const fieldDefinition = field.definition

  const emitNodeForFieldDefinition = async (
    fieldDefinition: tFieldDefinition,
    tenantId: string,
    proxyId: string,
    version: string,
    fieldPath: string,
    payloadPath: string,
    emitNode: (node: tDependencyGraphNode) => Promise<void>,
    emitDataSubNodes: (node: tDependencyGraphNode) => Promise<void>
  ) => {
    const target = getTarget(TARGETABLE_ENTITIES.FIELDS, proxyId, `${index}.${fieldPath}`)
    await emitFieldOnGraph(
      `${target}.readable`,
      [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
      fieldDefinition.readable,
      version,
      fieldDefinition.condition ?? null,
      fieldDefinition.mergePolicies,
      tenantId,
      emitNode,
      []
    )
    await emitFieldOnGraph(
      `${target}.writable`,
      [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
      fieldDefinition.writable,
      version,
      fieldDefinition.condition ?? null,
      fieldDefinition.mergePolicies,
      tenantId,
      emitNode,
      []
    )

    const subNodesDefinitionsForData: tDependencyGraphNode[] = []
    const emitSubNodesDefinitionsForData = async (node: tDependencyGraphNode) => {
      subNodesDefinitionsForData.push(node)
    }

    if (fieldDefinition.type.kind === 'list')
      await emitNodeForFieldDefinition(
        fieldDefinition.type.itemType,
        tenantId,
        proxyId,
        version,
        `${fieldPath}.type.itemType`,
        `${payloadPath}.[]`,
        emitNode,
        emitSubNodesDefinitionsForData
      )

    if (fieldDefinition.type.kind === 'object')
      for (const [subFieldKey, subFieldDefinition] of Object.entries(fieldDefinition.type.object))
        await emitNodeForFieldDefinition(
          subFieldDefinition,
          tenantId,
          proxyId,
          version,
          `${fieldPath}.type.object.${subFieldKey}`,
          `${payloadPath}.${subFieldKey}`,
          emitNode,
          emitSubNodesDefinitionsForData
        )

    if (fieldDefinition.type.kind === 'enum')
      await emitFieldOnGraph(
        `${target}.type.options`,
        [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
        fieldDefinition.type.options,
        version,
        fieldDefinition.condition ?? null,
        fieldDefinition.mergePolicies,
        tenantId,
        emitNode,
        []
      )

    await emitFieldOnGraph(
      `${target}.automaticValue`,
      [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
      fieldDefinition.automaticValue ?? null,
      version,
      fieldDefinition.condition ?? null,
      fieldDefinition.mergePolicies,
      tenantId,
      emitNode,
      []
    )

    const dataTarget = getTarget(TARGETABLE_ENTITIES.DATA, proxyId, payloadPath)
    await emitFieldOnGraph(
      dataTarget,
      [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
      fieldDefinition.automaticValue ?? null,
      version,
      fieldDefinition.condition ?? null,
      fieldDefinition.mergePolicies,
      tenantId,
      emitDataSubNodes,
      subNodesDefinitionsForData
    )
  }

  await emitNodeForFieldDefinition(
    fieldDefinition,
    tenantId,
    proxyId,
    field.version,
    'definition',
    field.id,
    emitNode,
    emitNode
  )
}

export const processFieldsAndRepresentations = async (
  fields: tField[],
  representations: tFieldRepresentation[],
  processNodes: (nodes: tDependencyGraphNode[]) => Promise<void>
) => {
  const nodes: tDependencyGraphNode[] = []

  const emitNode = async (node: tDependencyGraphNode) => {
    nodes.push(node)
  }

  for (let index = 0; index < fields.length; index++)
    await createDependencyGraphNodeForField(fields[index], 'tenantId', fields[index].id, emitNode, index)

  for (let index = 0; index < representations.length; index++)
    await createDependencyGraphNodeForRepresentation(
      representations[index],
      'tenantId',
      representations[index].fieldId,
      emitNode,
      index
    )

  await processNodes(nodes)
}
