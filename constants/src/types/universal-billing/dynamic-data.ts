import { tDynamicAnagraphicSetup } from '../anagraphics'
import { tDynamicCapability } from '../roles'
import { tTranslatableString } from './base-types'
import { tTypedExpression } from './expressions'
import { tField, tRepresentation } from './fields'
import { tSupportedValue } from './type-values'

export type tDynamicFields = {
  [fieldId: string]: tSupportedValue
}

export type tDynamicSections = {
  [section: string]: tDynamicFields
}

export type tDynamicPartsDefinitionMap = {
  [fieldId: string]: tField
}

export type tContractsDynamicData = {
  id: string
  name: tTranslatableString
  description: tTranslatableString
  sections: {
    [id: string]: {
      id:string
      name: tTranslatableString
      description: tTranslatableString,
      info: {
        title: tTranslatableString,
        body: tTranslatableString
      }
      fields: tField[]
      representation: tRepresentation
    }
  }
}

export type tOPStandardDynamicData = {
  id: string
  name: tTranslatableString
  description: tTranslatableString
  sections: {
    id: string
    name: tTranslatableString
    description: tTranslatableString
    fields: tField[]
    representation: tRepresentation
  }[]
}

export type tCasesDynamicData = {
  id: string
  name: tTranslatableString
  description: tTranslatableString
  fields: tField[]
  pcMaterials: {
    checkValidCase: tTypedExpression<boolean>
  }
  patientTab: {
    bookingRepresentation: tRepresentation
    caseRepresentation: tRepresentation
  }
  checkinTab: {
    representation: tRepresentation
  }
  bookingTab: {
    bookingRepresentation: tRepresentation
    caseRepresentation: tRepresentation
  }
  surgeryTab: {
    bookingRepresentation: tRepresentation
    caseRepresentation: tRepresentation
  }
  anesthesiaTab: {
    representation: tRepresentation
  }
  preOpTab: {
    representation: tRepresentation
  }
  intraOpTab: {
    representation: tRepresentation
  }
  postOpTab: {
    representation: tRepresentation
  }
  checkoutTab: {
    representation: tRepresentation
  }
}

export type tAnagraphicsDynamicData = tDynamicAnagraphicSetup[]

export type tDynamicCapabilities = tDynamicCapability[]

export const DYNAMIC_ENTITIES_NAME = {
  contracts: 'contracts',
  opStandards: 'opStandards',
  cases: 'cases',
  anagraphics: 'anagraphics',
  capabilities: 'capabilities'
} as const

// XXX this is used mainly for the frontend reducer (like a template), but please
// try and keep it up to date
export type tDynamicDataList = {
  [DYNAMIC_ENTITIES_NAME.contracts]: tContractsDynamicData
  [DYNAMIC_ENTITIES_NAME.opStandards]: tOPStandardDynamicData
  [DYNAMIC_ENTITIES_NAME.cases]: tCasesDynamicData
  [DYNAMIC_ENTITIES_NAME.anagraphics]: tAnagraphicsDynamicData
  [DYNAMIC_ENTITIES_NAME.capabilities]: tDynamicCapabilities
}
