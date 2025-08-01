import { endOfDay, startOfDay } from 'date-fns'
import { Contract, IDataGridContract } from '../types'

const checkNumber = (value: any) =>
  value !== null && value !== '' && !isNaN(Number(value)) ? Number(value) : undefined

export const formatContract = (contract: Contract) => ({
  ...contract,
  details: {
    ...contract.details,
    ...(contract.details?.validFrom && {
      validFrom: new Date(contract.details.validFrom),
    }),
    ...(contract.details?.validUntil && {
      validUntil: new Date(contract.details.validUntil),
    }),
    surgerySlots: contract.details?.surgerySlots?.map(slot => ({
      ...slot,
      from: new Date(slot.from),
      to: new Date(slot.to),
    })),
  },
})

export const formatContractPayload = (data: any) => ({
  contractId: data.contractId,
  details: {
    ...data.details,
    validFrom: startOfDay(new Date(data.details.validFrom)).getTime(),
    validUntil: endOfDay(new Date(data.details.validUntil)).getTime(),
    surgerySlots: data.details.surgerySlots?.map((obj: { from: string; to: string }) => ({
      from: new Date(obj.from).getTime(),
      to: new Date(obj.to).getTime(),
    })),
  },
  billingA: data.billingA,
  billingB: data.billingB,
  billingC1: {
    firstHourWithAnesthesiologistFee: checkNumber(data.billingC1?.firstHourWithAnesthesiologistFee),
    withAnesthesiologistFeePerMinute: checkNumber(data.billingC1?.withAnesthesiologistFeePerMinute),
    noAnesthesiologistFeePerMinute: checkNumber(data.billingC1?.noAnesthesiologistFeePerMinute),
    materialPrices: data.billingC1?.materialPrices,
  },
  billingC2: data.billingC2,
  billingC3: data.billingC3,
  billingD: data.billingD,
  billingE: data.billingE,
  billingG: {
    firstHourWithAnesthesiologistFee: checkNumber(data.billingG?.firstHourWithAnesthesiologistFee),
    withAnesthesiologistFeePerMinute: checkNumber(data.billingG?.withAnesthesiologistFeePerMinute),
    noAnesthesiologistFeePerMinute: checkNumber(data.billingG?.noAnesthesiologistFeePerMinute),
    materialPrices: data.billingG?.materialPrices,
  },
  opStandards: data.opStandards,
})

export const formatContractForDataGrid = (contract: Contract): IDataGridContract => ({
  contractId: contract.contractId,
  associatedDoctor: {
    firstName: contract.associatedDoctor?.firstName,
    lastName: contract.associatedDoctor?.lastName,
    title: contract.associatedDoctor?.title,
  },
  details: {
    contractName: contract.details.contractName,
    validFrom: contract.details.validFrom as Date,
    validUntil: contract.details.validUntil as Date,
    status: contract.details.status!,
    doctorId: contract.details.doctorId,
  },
})
