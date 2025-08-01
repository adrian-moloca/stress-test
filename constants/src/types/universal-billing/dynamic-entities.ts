import { Case } from '../cases'
import { Contract, OpStandard } from '../dataModel'
import { SOURCE_SCHEMAS } from './local-events'
import { tProxy } from './proxy'

export type tDynamicEntities = Case | Contract | OpStandard | tProxy

export const DYNAMIC_ENTITIES_SCHEMAS = [
  SOURCE_SCHEMAS.PROXY,
  SOURCE_SCHEMAS.CONTRACTS,
  SOURCE_SCHEMAS.OPSTANDARDS
] as const

export const RW_PLUGIN_TAG = 'useDynamicRW'

export const CHANGING_AGENTS = {
  USER: 'USER',
  SYSTEM: 'SYSTEM'
} as const

export type tValidChangingAgents = typeof CHANGING_AGENTS[keyof typeof CHANGING_AGENTS]

export type tDynamicChanges = {
  [fieldPath: string]: tValidChangingAgents
}

export type tBodyWithDynamicChanges = Record<string, unknown> & {
  changesMap: tDynamicChanges
}
