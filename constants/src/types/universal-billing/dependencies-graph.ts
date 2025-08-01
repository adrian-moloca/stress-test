import { tValidChangingAgents } from './dynamic-entities'
import { tCondition, tDependencyMap, tExpression } from './expressions'
import { tField, tViewAs } from './fields'

export const DEPENDENCY_NODE_STATUS = {
  DIRTY: 'DIRTY',
  OK: 'OK',
  TO_DELETE: 'TO_DELETE',
  ERROR_EXPRESSION: 'ERROR_EXPRESSION',
  ERROR_CONDITION: 'ERROR_CONDITION',
} as const

export type tDependencyNodeStatus = typeof DEPENDENCY_NODE_STATUS[keyof
  typeof DEPENDENCY_NODE_STATUS]

export const MERGING_POLICIES = {
  OVERWRITE: 'OVERWRITE',
  SHY: 'SHY',
} as const

export type tHorizontalMergingPolicies = (typeof MERGING_POLICIES)[keyof typeof MERGING_POLICIES]

export const VERTICAL_MERGING_POLICIES = {
  PARENT: 'PARENT',
  CHILD: 'CHILD',
} as const

export type tVerticalMergingPolicies =
  (typeof VERTICAL_MERGING_POLICIES)[keyof typeof VERTICAL_MERGING_POLICIES]

export type tNodeMetadata = {
  currentValue: unknown | null
  automaticValue: unknown | null
  source: tValidChangingAgents | null
} & Record<string, unknown>

export type tDependencyGraphNode = {
  target: string
  entity: string | null
  definitionDeps: string[]
  expression: tExpression | null
  expressionErrors?: string
  expressionDeps: string[]
  expressionDepsDetails: tDependencyMap
  status: tDependencyNodeStatus
  version: string
  condition: tCondition | null
  conditionExpressionErrors?: string
  conditionDeps: string[] | null
  conditionDepsDetail: tDependencyMap
  lastConditionValue: boolean | null
  policy: {
    horizontal: tHorizontalMergingPolicies
    vertical: tVerticalMergingPolicies
  }
  tenantId: string
  subNodes: tDependencyGraph
  subNodesDefinitions: tDependencyGraph
  dirtyReason?: string[]
  childDeps: string[]
  metadata: tNodeMetadata
}

export type tDependencyGraph = tDependencyGraphNode[]

export const DEPENDENCY_JOB_TYPE = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const

export type tDependencyJobType = (typeof DEPENDENCY_JOB_TYPE)[keyof typeof DEPENDENCY_JOB_TYPE]

export type tGraphFieldJob = {
  id: string
  type: tDependencyJobType
  field: tField
  domainId: string
  tenantId: string
}

export type tGenericDependencyJob = {
  type: typeof DEPENDENCY_NODE_STATUS.DIRTY
  nodes: tDependencyGraphNode[]
  tenantId: string
}

export const ALLOWED_DEFINITION_DEPS = {
  DEFINEDBY: 'definedBy',
} as const

type RepresentationKindKeys = tViewAs['representationKind']
type DerivedRepresentationKeys = `REPRESENTATION_${RepresentationKindKeys & string}`
type TargetableEntityKey = 'DATA' | 'FIELDS' | 'PROXY' | 'CASE' | DerivedRepresentationKeys

export const TARGETABLE_ENTITIES = {
  DATA: 'data',
  FIELDS: 'fields',
  REPRESENTATION_enum: 'representationenum',
  REPRESENTATION_table: 'representationtable',
  REPRESENTATION_list: 'representationlist',
  REPRESENTATION_accordion: 'representationaccordion',
  REPRESENTATION_price: 'representationprice',
  REPRESENTATION_positivePrice: 'representationpositivePrice',
  REPRESENTATION_positiveNumber: 'representationpositiveNumber',
  REPRESENTATION_twoDecimalNumber: 'representationtwoDecimalNumber',
  REPRESENTATION_textWithPattern: 'representationtextWithPattern',
  REPRESENTATION_uniqueId: 'representationuniqueId',
  REPRESENTATION_email: 'representationemail',
  REPRESENTATION_date: 'representationdate',
  REPRESENTATION_dateWithoutTimestamp: 'representationdateWithoutTimestamp',
  REPRESENTATION_timestamp: 'representationtimestamp',
  REPRESENTATION_object: 'representationobject',
  REPRESENTATION_boolean: 'representationboolean',
  REPRESENTATION_string: 'representationstring',
  REPRESENTATION_number: 'representationnumber',
  REPRESENTATION_localizedText: 'representationlocalizedText',
  PROXY: 'proxy',
  CASE: 'case',
} as const satisfies Record<TargetableEntityKey, string>

export type tTargetableEntities = (typeof TARGETABLE_ENTITIES)[keyof typeof TARGETABLE_ENTITIES]

export const TARGET_TYPES = {
  ENTITY: 'ENTITY',
  NOT_VALID: 'NOT_VALID',
} as const

export type tParsedEntityTarget = {
  type: typeof TARGET_TYPES.ENTITY
  entity: string
  id: string
  rest: string
}

export type tParsedNotValidTarget = {
  type: typeof TARGET_TYPES.NOT_VALID
}

export type tParsedTarget = tParsedEntityTarget | tParsedNotValidTarget

export type tEntityRetrievalFunc = (id: string) => Promise<unknown>

export type tEntityUpdateFunc = (
  id: string,
  updatePayload: Record<string, unknown>
) => Promise<void>

export type tDependenciesReplacementMap = {
  [key: string]: string
}

export type tDependenciesReplacementFun = (
  dependency: string,
  replacementMap: tDependenciesReplacementMap
) => string

export type tMarkAsDirtyPayload = {
  target: string
  tenantId: string
}

export type tNodesToProcessPayload = {
  [entityId: string]: tDependencyGraphNode[]
}

export type tUpdateNodeFun = (node: Partial<tDependencyGraphNode>) => Promise<void>

export type tFieldOperations = {
  type: tDependencyJobType
  field: tField
  domainId: string
  tenantId: string
  blocking: boolean
  processed: boolean
}

export type tUpdateTargetPayload = {
  id: string
  updatesMap: Record<string, unknown>
  targetEntity: string
  mergePolicy: {
    horizontal: tHorizontalMergingPolicies
    vertical: tVerticalMergingPolicies
  }
}
