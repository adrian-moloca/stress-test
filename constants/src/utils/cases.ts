import { AnesthesiologistPresence, CaseStatus, caseStatusOrder } from '../enums'
import { OpStandardAnesthesiaRow, Timestamps } from '../types'

export const getAutoAnesthesiologistPresence = (anesthesiaList: OpStandardAnesthesiaRow[]) => {
  if (anesthesiaList.length === 0) return AnesthesiologistPresence.NO_ANESTHESIOLOGIST

  return AnesthesiologistPresence.WITH_ANESTHESIOLOGIST
}

export const isAnyTimestampMissing = (
  timestampNames: string[],
  timestamps: Timestamps,
  caseStatus: CaseStatus,
  refStatus: CaseStatus,
) => {
  const caseStatusIndex = caseStatusOrder.indexOf(caseStatus)
  const refStatusIndex = caseStatusOrder.indexOf(refStatus)

  if (caseStatusIndex <= refStatusIndex || caseStatusIndex === -1) return false

  // @ts-expect-error types are a mess right now
  return timestampNames.some(current => timestamps[current] === null ||
    // @ts-expect-error types are a mess right now
    timestamps[current] === undefined)
}

export const isAnesthesiaNeeded = (anesthesiaList: OpStandardAnesthesiaRow[]) => {
  return anesthesiaList.length > 0
}
