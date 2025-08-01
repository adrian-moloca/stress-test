import {
  AxiosCancellationError,
  Contract,
  CreateContractDto,
  EditContractDto,
  Identifier,
  OpStandard,
  OpStandardCreationProps,
  QueryContractDto,
  QueryOpStandardDto,
} from '@smambu/lib.constants'
import { contractClient } from './apiClient'
import { getReadableErrorMessage } from 'utilities/misc'

export class ContractApi {
  static createContract (data: CreateContractDto) {
    return contractClient
      .post('/contracts', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static deleteContract (id: Contract['contractId']) {
    return contractClient
      .delete(`/contracts/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static updateContract (id: Contract['contractId'], contract: EditContractDto) {
    return contractClient
      .put(`/contracts/${id}`, contract)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async getContracts (queries?: QueryContractDto, abortController?: AbortController) {
    try {
      const res = await contractClient.get('/contracts', {
        params: { ...queries, status: queries?.status ?? 'all' },
        signal: abortController?.signal,
      })
      return res.data
    } catch (err) {
      if (abortController?.signal.aborted) throw new AxiosCancellationError()
      else throw err
    }
  }

  static async getContractsByIds (queries: { contractsIds: string[] },
    abortController?: AbortController) {
    try {
      const res = await contractClient.get('/contracts/getContractsByIds', {
        params: queries,
        signal: abortController?.signal,
      })
      return res.data
    } catch (err) {
      if (abortController?.signal.aborted) throw new AxiosCancellationError()
      else throw err
    }
  }

  static getContractById (id: Identifier) {
    return contractClient
      .get(`/contracts/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static createOpStandard (data: OpStandardCreationProps, contractId?: string) {
    return contractClient
      .post('/contracts/op-standards', !contractId ? data : { ...data, contractId })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static deleteOpStandard (OpStandardId: OpStandard['opStandardId'], contractId?: Contract['contractId']) {
    return contractClient
      .delete(`/contracts/op-standards/${OpStandardId}`, {
        data: { contractId },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static updateOpStandard (
    id: OpStandard['opStandardId'],
    opStandard: Omit<OpStandard, 'opStandardId' | 'tenantId'>,
    contractId: string,
  ) {
    return contractClient
      .put(`/contracts/op-standards/${id}`, {
        ...opStandard,
        contractId,
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static getOpStandards (queries?: QueryOpStandardDto) {
    return contractClient
      .get('/contracts/op-standards', {
        params: { ...queries },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static getNotLinkedOpStandards ({
    contractId,
    doctorId
  }:
  { contractId?: string;
    doctorId?: string }) {
    return contractClient
      .get(`/contracts/op-standards/notLinked/${contractId ?? 'new'}/${doctorId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static getOpStandardById (id: Identifier) {
    return contractClient
      .get(`/contracts/op-standards/${id}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static updateChangeRequest (id: Identifier, changeRequest: string) {
    return contractClient
      .put(`/contracts/op-standards/changeRequest/${id}`, {
        changeRequest,
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static getDoctorOpstandards (doctorId: Identifier) {
    return contractClient
      .get('/contracts/doctorOpstandards', {
        params: {
          doctorId,
        },
      })
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
