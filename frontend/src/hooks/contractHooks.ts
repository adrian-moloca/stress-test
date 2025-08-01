import { isAfter, isBefore, isSameDay } from 'date-fns'
import {
  Contract,
  Identifier,
  QueryContractDto,
  ToastType,
  formatContract,
  permissionRequests,
  OpStandard,
  OpStandardPosition_Name,
  OpStandardBodyRegion_Name,
  NewContractMatchOpStandard,
  validateCreateContractData,
  validateEditContractData,
  ILimitedCase,
  OpStandardSpinalSegment_Name,
  OpStandardFinger_Name,
  OpStandardFeet_Name,
} from '@smambu/lib.constants'
import { useAppSelector } from 'store'
import useCall from './useCall'
import { useDispatch, useSelector } from 'react-redux'
import { useCheckPermission, useGetCheckPermission } from './userPermission'
import { ContractApi } from 'api/contracts.api'
import { CONTRACT_ACTION, DRAFT_CONTRACT_ACTION, GLOBAL_ACTION } from 'store/actions'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from 'routes/routes'
import { RootState } from 'store/reducers/rootReducer'

export const useGetContractsByDoctorId = () => {
  const contracts = useAppSelector(state => state.contracts)
  return (doctorId: string) =>
    Object.values(contracts)
      .filter((contract: Contract) => contract?.details?.doctorId === doctorId)
}

export const useImportContractsByDoctorIdIntoState = () => {
  const getContracts = useGetContracts()
  const dispatch = useDispatch()
  const canViewContracts = useCheckPermission(permissionRequests.canViewContracts)
  return async (doctorId: string) => {
    if (canViewContracts) {
      const contracts = await getContracts({
        doctorId,
        status: 'active',
      })
      if (contracts?.results?.length > 0)
        dispatch({
          type: CONTRACT_ACTION.SET_CONTRACTS,
          data: contracts.results,
        })
    }
    return null
  }
}

export const useIsDateInsideDoctorContracts = () => {
  const getContractsByDoctorId = useGetContractsByDoctorId()

  return ({ date, caseItem }: { date: Date; caseItem: ILimitedCase }) => {
    const thisDoctorsContracts = getContractsByDoctorId(caseItem?.bookingSection?.doctorId)
    const result =
      thisDoctorsContracts &&
      // TODO remember to check if matching the opStandardId is sufficient (or we should match a previousContractOpstandardId && remember to implement the conflict detection)
      thisDoctorsContracts
        .filter(contract =>
          Object.values(contract?.opStandards ?? {}).some(
            contr => contr.opStandardId === caseItem.bookingSection.opStandardId,
          ))
        .some((contract: Contract) => {
          return (
            (!isAfter(contract.details.validFrom, date) ||
            isSameDay(contract.details.validFrom, date)) &&
            (!isBefore(contract.details.validUntil, date) ||
            isSameDay(contract.details.validUntil, date))
          )
        })

    return result
  }
}

export const useGetContractById = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const canViewContracts = useCheckPermission(permissionRequests.canViewContracts)

  return (id: Identifier) =>
    call(async function getContractById () {
      if (!canViewContracts) return

      const res = await ContractApi.getContractById(id)
      const contract = formatContract(res)

      dispatch({
        type: CONTRACT_ACTION.SET_CONTRACTS,
        data: [contract],
      })
      return contract
    }, false)
}

export const useGetContractsByIds = () => {
  const dispatch = useDispatch()
  const canViewContracts = useCheckPermission(permissionRequests.canViewContracts)

  return async (query: { contractsIds: Identifier[] }) => {
    if (canViewContracts) {
      const res = await ContractApi.getContractsByIds(query)
      const results = res?.results?.map((contract: Contract) => formatContract(contract))

      dispatch({
        type: CONTRACT_ACTION.SET_CONTRACTS,
        data: results,
      })
      return {
        ...res,
        results,
      }
    }
    return null
  }
}

export const useGetContracts = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const canViewContracts = useCheckPermission(permissionRequests.canViewContracts)

  return (queries?: QueryContractDto, abortController?: AbortController) =>
    call(async function getContracts () {
      if (!canViewContracts) return

      const res = await ContractApi.getContracts(queries, abortController)
      const results = res?.results?.map((contract: Contract) => formatContract(contract))

      dispatch({
        type: CONTRACT_ACTION.SET_CONTRACTS,
        data: results,
      })
      return {
        ...res,
        results,
      }
    })
}

export const useDeleteContract = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const checkPermission = useGetCheckPermission()
  const canDeleteContracts = checkPermission(permissionRequests.canDeleteContracts)

  return (id: Contract['contractId']) =>
    call(async function deleteContract () {
      if (!canDeleteContracts) return

      await ContractApi.deleteContract(id)

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'contract_delete_success',
          type: ToastType.success,
        },
      })
    })
}

export const useUpdateContract = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const checkPermission = useGetCheckPermission()
  const canCreateContract = checkPermission(permissionRequests.canCreateContract)
  const canViewDoctors = checkPermission(permissionRequests.canViewDoctors)
  const navigate = useNavigate()

  return (contract: Omit<Contract, 'id'>, id?: string) =>
    call(async function updateContract () {
      const isNew = !id
      let response = null
      if (isNew) {
        if (!canCreateContract || !canViewDoctors) {
          dispatch({
            type: GLOBAL_ACTION.ADD_TOAST,
            data: {
              text: 'common_no_permission',
              type: ToastType.error,
            },
          })
          return
        }
        response = await ContractApi.createContract(validateCreateContractData(contract))
      } else {
        const canEditContract = checkPermission(permissionRequests.canEditContract, { contract })
        if (!canEditContract) {
          dispatch({
            type: GLOBAL_ACTION.ADD_TOAST,
            data: {
              text: 'common_no_permission',
              type: ToastType.error,
            },
          })
          return
        }
        response = await ContractApi.updateContract(id, validateEditContractData(contract))
      }

      dispatch({
        type: DRAFT_CONTRACT_ACTION.RESET_DRAFT_CONTRACT,
      })

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: isNew ? 'opstandard_create_success' : 'opstandard_update_success',
          type: ToastType.success,
        },
      })

      navigate(routes.contractsList)
      return response
    })
}

export const useNewContractMatchOpStandard = ({
  currentContractId,
  changeContractId,
  currentOpStandardId,
  currentPositions,
  currentBodyRegions,
}: {
  currentContractId: string
  changeContractId: string
  currentOpStandardId: string
  currentPositions: OpStandardPosition_Name[]
  currentBodyRegions: (
    | number
    | OpStandardBodyRegion_Name
    | OpStandardSpinalSegment_Name
    | OpStandardFinger_Name
    | OpStandardFeet_Name
  )[]
}) => {
  const [newContractMatch, setNewContractMatch] = useState<NewContractMatchOpStandard>(
    NewContractMatchOpStandard.noMatch,
  )
  const [conflicts, setConflicts] = useState<{ positions: boolean; bodyRegions: boolean }>({
    positions: false,
    bodyRegions: false,
  })
  const currentOpStandard = useAppSelector(
    state => state.contracts?.[currentContractId]?.opStandards?.[currentOpStandardId],
  )
  const newOpStandard: OpStandard | undefined = useAppSelector(
    state =>
      Object.values(state.contracts?.[changeContractId]?.opStandards ?? {})?.find(
        opStandard => opStandard.previousContractOpStandardId === currentOpStandardId,
      ) ??
      Object.values(state.contracts?.[changeContractId]?.opStandards ?? {})?.find(
        opStandard => opStandard.opStandardId === currentOpStandard?.previousContractOpStandardId,
      ),
  )

  useEffect(() => {
    if (newOpStandard != null) {
      const positionsConflict = !currentPositions.every(position =>
        newOpStandard.bookingSection.positions.includes(position))
      const bodyRegionsConflict = !currentBodyRegions.every(bodyRegion =>
        newOpStandard.bookingSection.bodyRegions.includes(bodyRegion))
      setConflicts({ positions: positionsConflict, bodyRegions: bodyRegionsConflict })
      if (!positionsConflict && !bodyRegionsConflict) {
        setNewContractMatch(NewContractMatchOpStandard.match)
        return
      }
      setNewContractMatch(NewContractMatchOpStandard.matchWithConflict)
    } else {
      setNewContractMatch(NewContractMatchOpStandard.noMatch)
    }
  }, [currentContractId, changeContractId])
  return {
    newContractMatch,
    conflicts,
    newOpStandard,
  }
}

export const useGetNotLinkedOpStandards = () => {
  const call = useCall()
  const canViewOpStandards = useCheckPermission(permissionRequests.canViewOpStandards)

  return ({ contractId, doctorId }: { contractId?: string; doctorId?: string }) =>
    call(async function getOpStandardById () {
      if (!canViewOpStandards || !doctorId) return

      return await ContractApi.getNotLinkedOpStandards({ contractId, doctorId })
    })
}

export const useGetOpStandardById = () => {
  const call = useCall()
  const canViewOpStandards = useCheckPermission(permissionRequests.canViewOpStandards)

  return (opStandardId: string) =>
    call(async function getOpStandardById () {
      if (!canViewOpStandards) return
      return await ContractApi.getOpStandardById(opStandardId)
    })
}

export const useCreateOpStandard = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const canCreateOpStandards = useCheckPermission(permissionRequests.canCreateOpStandards)

  return (opStandard: Omit<OpStandard, 'opStandardId' | 'tenantId'>, contractId?: string) =>
    call(async function updateOpStandard () {
      if (!canCreateOpStandards) return

      let res = await ContractApi.createOpStandard(
        {
          ...opStandard,
          opStandardId: undefined,
          id: undefined,
          _id: undefined,
        },
        contractId,
      )

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'opstandard_create_success',
          type: ToastType.success,
        },
      })
      return res
    })
}

export const useUpdateOpStandard = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const checkPermission = useGetCheckPermission()
  const canEditOpStandards = checkPermission(permissionRequests.canEditOpStandards)

  return (
    opStandard: Omit<OpStandard, 'opStandardId' | 'tenantId'>,
    opStandardId: string,
    contractId: string,
    targetPath?: string,
  ) =>
    call(async function updateOpStandard () {
      if (!canEditOpStandards) return

      const response = await ContractApi.updateOpStandard(opStandardId, opStandard, contractId)

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'contract_update_success',
          type: ToastType.success,
          targetPath,
        },
      })

      return response
    })
}

export const useDeleteOpStandard = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const canDeleteOpStandards = useCheckPermission(permissionRequests.canDeleteOpStandards)

  return (OpStandardId: OpStandard['opStandardId'], contractId?: Contract['contractId']) =>
    call(async () => {
      if (!canDeleteOpStandards) return

      await ContractApi.deleteOpStandard(OpStandardId, contractId)

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'contract_delete_success',
          type: ToastType.success,
        },
      })
    })
}

export const useCopyOpStandards = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const canCreateOpStandards = useCheckPermission(permissionRequests.canCreateOpStandards)

  return (contract: Contract, contractId?: string, disableAlerts?: boolean) =>
    call(async function useCopyOpStandards () {
      if (!canCreateOpStandards) return

      if (Object.keys(contract.opStandards ?? {}).length === 0 && !disableAlerts) {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            text: 'op_standards_copy_empty',
            type: ToastType.warning,
          },
        })
        return
      }

      const results = await Promise.all(
        Object.values(contract.opStandards ?? {}).map(async opStandard => {
          let res = await ContractApi.createOpStandard(
            {
              ...opStandard,
              previousContractOpStandardId: opStandard.opStandardId,
              opStandardId: undefined,
              id: undefined,
              _id: undefined,
            },
            contractId,
          )
          return res
        }),
      )
      if (!disableAlerts)
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            text: 'op_standards_copy_success',
            type: ToastType.success,
          },
        })

      return (results ?? []).reduce((acc, cur) => ({ ...acc, [cur.opStandardId]: cur }), {})
    })
}

export const useUpdateOpstandardChangeRequest = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const contracts = useSelector((state: RootState) => state.contracts)
  return (contractId: string, opStandardId: string, changeRequest: string) =>
    call(async function updateOpstandardChangeRequest () {
      const response = await ContractApi.updateChangeRequest(opStandardId, changeRequest)
      dispatch({
        type: CONTRACT_ACTION.SET_CONTRACTS,
        data: [
          {
            ...(contracts[contractId] ?? {}),
            opStandards: {
              ...(contracts[contractId].opStandards ?? {}),
              [opStandardId]: {
                ...(contracts?.[contractId]?.opStandards?.[opStandardId] ?? {}),
                changeRequest,
              },
            },
          },
        ],
      })

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'opstandard_changeRequest_success',
          type: ToastType.success,
        },
      })

      return response
    })
}

export const useDoctorOpstandards = (doctorId?: string) => {
  const call = useCall()
  const canViewOpstandards = useCheckPermission(permissionRequests.canViewOpStandards)
  const [doctorOpstandards, setdoctorOpstandards] = useState<OpStandard[]>([])

  const getOpstandards = () =>
    call(async function getDoctorOpstandards () {
      if (!canViewOpstandards) return
      if (doctorId == null) return
      const opstandards = await ContractApi.getDoctorOpstandards(doctorId)
      return opstandards
    })

  useEffect(() => {
    const getData = async () => {
      const data = await getOpstandards()
      if (data != null) setdoctorOpstandards(data)
    }
    getData()
  }, [doctorId])

  return {
    doctorOpstandards,
  }
}
