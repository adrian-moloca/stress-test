import { IPcMaterial, PaginatedPrescriptionsResponse, permissionRequests, PrescriptionsFullTextQueryDto, GetSammelCheckpointPreviewDTO, MaterialUsageItem, IHydratedPrescription } from '@smambu/lib.constants'
import { BillingApi } from 'api/billingApi'
import React, { useEffect, useState } from 'react'
import useCall from './useCall'
import { useGetCheckPermission } from './userPermission'
import { trlb } from 'utilities'
import { GridSortModel } from '@mui/x-data-grid'

export const useGetPcMaterialByCaseId = (caseId: string) => {
  const [pcMaterial, setPcMaterial] = useState<IPcMaterial>()
  const call = useCall()

  useEffect(() => {
    const getPcMaterialByCaseId = async (caseId: string) =>
      call(async function getPcMaterialsByCaseId () {
        const pcMaterials = await BillingApi.getPcMaterialsByCasesIds([caseId])
        setPcMaterial(pcMaterials[0])
      })
    if (caseId)
      getPcMaterialByCaseId(caseId)
    else
      setPcMaterial(undefined)
  }, [caseId])

  return { pcMaterial }
}

export const useGetPcMaterialsByCasesIds = (casesIds: string[]) => {
  const [pcMaterials, setPcMaterials] = useState<IPcMaterial[]>([])
  const call = useCall()

  const stringifiedCasesIds = [...casesIds].sort().join(',')

  useEffect(() => {
    const getPcMaterialByCaseId = async (casesIds: string[]) =>
      call(async function getPcMaterialsByCaseId () {
        const pcMaterials = await BillingApi.getPcMaterialsByCasesIds(casesIds)
        setPcMaterials(pcMaterials)
      })
    if (stringifiedCasesIds.length > 0)
      getPcMaterialByCaseId(stringifiedCasesIds.split(','))
    else
      setPcMaterials([])
  }, [stringifiedCasesIds])

  return { pcMaterials }
}

export const useGetCheckpointPreview = () => {
  const call = useCall()
  return React.useCallback(
    (data: GetSammelCheckpointPreviewDTO) =>
      call(async function CheckpointPreview () {
        const checkpoint = await BillingApi.getCheckpointPreview(data)
        return checkpoint
      }),
    [],
  )
}

export const useGetPrescriptionsCSV = () => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const canViewPcMaterials = checkPermission(permissionRequests.canViewPcMaterials)

  const getPrescriptionsCSV = (
    fulltextsearch: string,
    fromDate: Date | null,
    toDate?: Date | null,
    sortBy?: string,
    casesIds?: string[],
  ) => call(async function getPrescriptionsCSV () {
    if (!canViewPcMaterials) throw new Error('User does not have permission to view pc materials') // Should never happen
    const fromTimestamp = fromDate ? fromDate.getTime().toString() : undefined
    const toTimestamp = toDate ? toDate.getTime().toString() : undefined

    const datePattern = trlb('dateTime_date_string')

    return call(async function getInvoicesCSV () {
      const query: PrescriptionsFullTextQueryDto = {
        query: fulltextsearch,
        datePattern,
        fromTimestamp,
        toTimestamp,
        sortBy,
        casesIds,
      }

      const res = await BillingApi.getPrescriptionsCSV(query)

      return res.results as IHydratedPrescription[]
    })
  })

  return getPrescriptionsCSV
}

export const useFetchPrescriptions = (
  fulltextsearch: string,
  page: number,
  limit: number,
  fromDate: Date | null,
  toDate?: Date | null,
  sortBy?: string,
  sortOrder?: string,
  casesIds?: string[],
) => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const canViewPcMaterials = checkPermission(permissionRequests.canViewCasesBilling)

  const [response, setResponse] = React.useState<PaginatedPrescriptionsResponse>({
    results: [],
    currentPage: 0,
    limit,
    total: 0,
  })

  const [sortModel, setSortModel] = React.useState<GridSortModel>([])

  const fromTimestamp = fromDate ? fromDate.getTime().toString() : undefined
  const toTimestamp = toDate ? toDate.getTime().toString() : undefined
  const datePattern = trlb('dateTime_date_string')

  React.useEffect(() => {
    if (!canViewPcMaterials) throw new Error('User does not have permission to view pc materials') // Should never happen

    call(async function fullTextSearchPrescriptions () {
      const query: PrescriptionsFullTextQueryDto = {
        query: fulltextsearch,
        page: !isNaN(page) ? page : 0,
        limit: response.limit,
        sortBy: sortBy ?? sortModel[0]?.field,
        sortOrder: sortOrder ?? (sortModel[0]?.sort || 'asc'),
        datePattern,
        fromTimestamp,
        toTimestamp,
        casesIds,
      }

      const res = await BillingApi.fetchPrescriptions(query)

      setResponse({
        ...res,
        results: res.results,
      })
    })
  }, [canViewPcMaterials, fromTimestamp, fulltextsearch, page, sortModel, toTimestamp])

  const onPageChange = (page: number) => {
    call(async function onPageChange () {
      if (isNaN(page)) return

      const query: PrescriptionsFullTextQueryDto = {
        query: fulltextsearch,
        page,
        limit: response.limit,
        sortBy: sortModel[0]?.field,
        sortOrder: sortModel[0]?.sort || 'asc',
        datePattern,
        fromTimestamp,
        toTimestamp,
      }

      const res = await BillingApi.fetchPrescriptions(query)
      setResponse({
        ...res,
        results: res.results,
        currentPage: page,
      })
    })
  }

  const onSortModelChange = (model: GridSortModel) => {
    call(async function onSortModelChange () {
      setSortModel(model)

      const query: PrescriptionsFullTextQueryDto = {
        query: fulltextsearch,
        page,
        limit: response.limit,
        sortBy: model[0]?.field,
        sortOrder: model[0]?.sort || 'asc',
        datePattern,
        fromTimestamp,
        toTimestamp,
      }

      const res = await BillingApi.fetchPrescriptions(query)

      setResponse({
        ...res,
        results: res.results,
      })
    })
  }

  const onPageSizeChange = (pageSize: number) => {
    call(async function onPageSizeChange () {
      const query: PrescriptionsFullTextQueryDto = {
        query: fulltextsearch,
        page: 0,
        limit: pageSize,
        sortBy: sortModel[0]?.field,
        sortOrder: sortModel[0]?.sort || 'asc',
        datePattern,
        fromTimestamp,
        toTimestamp,
      }

      const res = await BillingApi.fetchPrescriptions(query)
      setResponse({
        ...res,
        results: [...res.results],
      })
    })
  }

  const refreshCurrentPage = () => {
    call(async function refreshCurrentPage () {
      const query: PrescriptionsFullTextQueryDto = {
        query: fulltextsearch,
        page: response.currentPage,
        limit: response.limit,
        sortBy: sortModel[0]?.field,
        sortOrder: sortModel[0]?.sort || 'asc',
        datePattern,
        fromTimestamp,
        toTimestamp,
      }

      const res = await BillingApi.fetchPrescriptions(query)

      setResponse({
        ...res,
        results: res.results,
      })
    })
  }

  return {
    prescriptions: response.results,
    currentPage: response.currentPage,
    limit: response.limit,
    total: response.total,
    onPageChange,
    sortModel,
    onSortModelChange,
    onPageSizeChange,
    refreshCurrentPage,
  }
}

export const useGeneratePrescriptions = () => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const canViewPcMaterials = checkPermission(permissionRequests.canViewPcMaterials)

  const generatePrescriptions = (
    pcMaterialsIds: string[],
    isCancellation: boolean,
    prescriptionsToRefundIds?: string[]
  ) =>
    call(async function generatePrescriptions () {
      if (!canViewPcMaterials) throw new Error('User does not have permission to view pc materials') // Should never happen

      await BillingApi.generatePrescriptions({
        pcMaterialsIds, isCancellation, prescriptionsToRefundIds
      })
    })

  return generatePrescriptions
}

export const useSetPrescriptionPrescribed = () => {
  const call = useCall()

  return React.useCallback(
    (prescriptionId: string) =>
      call(async function setPrescribed () {
        const res = await BillingApi.setPrescriptionPrescribed(prescriptionId)
        return res
      }),
    [],
  )
}

export const useGetPrescriptionsPcMaterials = (
  doctorId: string | undefined,
  endDate: Date | null,
  refresh: boolean
) => {
  const call = useCall()

  const [results, setResults] = React.useState<MaterialUsageItem[]>([])

  React.useEffect(() => {
    call(async function getPrescriptionsPcMaterials () {
      if (!doctorId) {
        setResults([])
      } else {
        const res = await BillingApi.getPrescriptionsPcMaterials({
          doctorId,
          toTimestamp: String(endDate?.getTime()),
          datePattern: ''
        })

        setResults(res)
      }
    })
  }, [
    doctorId,
    refresh,
    endDate,
  ])

  return {
    items: results
  }
}
