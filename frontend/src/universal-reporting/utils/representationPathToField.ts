import {
  tFieldDefinition,
  tField,
} from '@smambu/lib.constants'
import { tFrontendPayload } from 'universal-reporting/types'
import { findCorrespondingPayloadPathInFIelds } from './findCorrespondingRepresentationPathInFIelds'
import { representationNodeTargetToPayloadPath } from './representationNodeTargetToPayloadPath'

export const representationPathToField = (
  representationTarget: string,
  entity: tFrontendPayload
): { item: tFieldDefinition; path: string } => {
  const payloadPath = representationNodeTargetToPayloadPath(representationTarget, entity)

  const fIeldItemAndPath = findCorrespondingPayloadPathInFIelds(
    payloadPath,
    Object.values(entity.fields) as unknown as ReadonlyArray<tField> // TODO: address cast
  )

  return fIeldItemAndPath
}
