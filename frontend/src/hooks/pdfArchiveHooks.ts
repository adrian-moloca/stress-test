import { PdfArchiveApi } from 'api/pdfArchives.api'
import useCall from './useCall'
import React, { useCallback } from 'react'
import { ArchiveAllEligiblesDTO, IGetPDFArchivesDTO, InvoiceType, IRequestPDFArchiveGenerationDTO, PaginatedPDFArchivesResponse, permissionRequests } from '@smambu/lib.constants'
import { useGetCheckPermission } from './userPermission'
import { trlb } from 'utilities'

const datePattern = trlb('dateTime_date_string')

export const useRequestPDFArchiveGeneration = () => {
  const call = useCall()
  return useCallback(
    (invoicesIds: string[]) => {
      const data: IRequestPDFArchiveGenerationDTO = {
        payload: invoicesIds
      }

      return call(async function CheckpointPreview () {
        const checkpoint = await PdfArchiveApi.requestArchiveGeneration(data)
        return checkpoint
      })
    },
    [],
  )
}

export const useFetchPDFArchives = (
  page: number,
  pageSize: number,
) => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const canDownloadBills = checkPermission(permissionRequests.canDownloadBills)

  const [response, setResponse] = React.useState<PaginatedPDFArchivesResponse>({
    results: [],
    currentPage: 0,
    limit: pageSize,
    total: 0,
  })

  React.useEffect(() => {
    if (!canDownloadBills) {
      const errorMessage = trlb('pdfDownloadBillsPermissionMissing')

      throw new Error(errorMessage)
    }

    call(async function getPdfArchives () {
      const query: IGetPDFArchivesDTO = {
        page,
        pageSize: response.limit,
      }

      const res = await PdfArchiveApi.getPDFArchives(query)

      setResponse(res)
    })
  }, [canDownloadBills, page, response.limit])

  const onPageChange = (page: number) => {
    call(async function onPageChange () {
      if (isNaN(page)) return

      const query: IGetPDFArchivesDTO = {
        page,
        pageSize: response.limit,
      }

      const res = await PdfArchiveApi.getPDFArchives(query)
      setResponse({
        ...res,
        results: res.results,
        currentPage: page,
      })
    })
  }

  const onPageSizeChange = (pageSize: number) => {
    call(async function onPageSizeChange () {
      const query: IGetPDFArchivesDTO = {
        page,
        pageSize,
      }
      const res = await PdfArchiveApi.getPDFArchives(query)

      setResponse({
        ...res,
        results: res.results,
      })
    })
  }

  const refreshCurrentPage = () => {
    call(async function refreshCurrentPage () {
      const query: IGetPDFArchivesDTO = {
        page: response.currentPage,
        pageSize: response.limit,
      }

      const res = await PdfArchiveApi.getPDFArchives(query)

      setResponse({
        ...res,
        results: res.results,
      })
    })
  }

  return {
    pdfArchives: response.results,
    currentPage: response.currentPage,
    limit: response.limit,
    total: response.total,
    onPageChange,
    onPageSizeChange,
    refreshCurrentPage,
  }
}

export const useArchiveAllEligibles = () => {
  const call = useCall()
  return useCallback(
    (
      startDate: Date | null,
      endDate: Date | null,
      query?: string,
      invoiceTypes?: InvoiceType[]
    ) => {
      const fromTimestamp = startDate ? startDate.getTime() : undefined
      const toTimestamp = endDate ? endDate.getTime() : undefined

      const payload: ArchiveAllEligiblesDTO = {
        datePattern,
        fromTimestamp,
        toTimestamp,
        query,
        invoiceTypes
      }

      return call(async function CheckpointPreview () {
        const checkpoint = await PdfArchiveApi.archiveAllEligibles(payload)
        return checkpoint
      })
    },
    [],
  )
}
