/* eslint-disable no-unused-vars */
export enum ContractStatus {
  All = 'all',
  Expired = 'expired',
  Active = 'active',
}

export enum NewContractMatchOpStandard {
  noMatch = 'noMatch',
  match = 'match',
  matchWithConflict = 'matchWithConflict',
}

export enum INTRAOPSECTIONS {
  EQUIPMENTS = 'equipments',
  MEDICATIONS = 'medications',
  STERILE_GOODS = 'sterileGoods',
  MATERIALS = 'materials',
}

export const intraOPSectionsWithMaterials = [
  'gloves',
  'positioningTools',
  'equipment',
  'disinfection',
  'covering',
  'surgicalInstruments',
  'disposableMaterial',
  'sutureMaterial',
  'medication_rinse',
  'extras',
  'particularities',
]

export const opstandardFieldsThatNotGenerateConflicts = ['changeRequest', 'id', 'createdAt', 'updatedAt']

export enum eSortByContractsFields {
  contractName = 'contractName',
  validUntil = 'validUntil',
  validFrom = 'validFrom',
  status = 'status',
  contractId = 'contractId',
}

export enum AnesthesiologistOpStandardProcess {
  CREATE = 'CREATE',
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  NEW_VERSION = 'NEW_VERSION',
}
