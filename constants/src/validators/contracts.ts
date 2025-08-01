import { CreateContractDto, EditContractDto } from '../dto'

export const validateCreateContractData = (data: any): CreateContractDto => ({
  details: data.details,
  billingA: data.billingA,
  billingB: data.billingB,
  billingC1: data.billingC1,
  billingC2: data.billingC2,
  billingC3: data.billingC3,
  billingD: data.billingD,
  billingE: data.billingE,
  billingG: data.billingG,
  opStandards: data.opStandards,
})

export const validateEditContractData = (data: any): EditContractDto => ({
  contractId: data.contractId,
  details: data.details,
  billingA: data.billingA,
  billingB: data.billingB,
  billingC1: data.billingC1,
  billingC2: data.billingC2,
  billingC3: data.billingC3,
  billingD: data.billingD,
  billingE: data.billingE,
  billingG: data.billingG,
  opStandards: data.opStandards,
})
