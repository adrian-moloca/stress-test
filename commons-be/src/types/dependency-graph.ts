import { tAnagraphicTypesValues, tLocalEventsMetadata, tLocalEventValue, tTrigger, tValidEventName } from '@smambu/lib.constantsjs'

export type tMatchingTriggers = {
  trigger: tTrigger
  domainId: string
  tenantId: string
}

export type tLocalEventScope = {
  source: tValidEventName
  sourceDocId: string
  previousValues: tLocalEventValue
  currentValues: tLocalEventValue
  metadata: tLocalEventsMetadata
}

export type tAnagraphicRawData = {
  rows: unknown[]
  anagraphicType: tAnagraphicTypesValues
  subType: tAnagraphicTypesValues
  tenantId: string
}

export type tAnagraphicMetadataRawValue = {
  anagraphicType: string
  subType: string
}
