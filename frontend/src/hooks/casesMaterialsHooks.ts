import { useCallback, useEffect, useState } from 'react'
import useCall from './useCall'
import {
  permissionRequests,
  MaterialPrice,
} from '@smambu/lib.constants'
import { useGetCheckPermission } from './userPermission'
import { SchedulingCasesApi } from 'api/schedulingCases.api'

export const useGetCaseMaterialsPrices = (caseId: string) => {
  const call = useCall()
  const checkPermission = useGetCheckPermission()
  const [caseMaterials, setCaseMaterials] = useState<MaterialPrice[]>([])
  const canViewMaterialsDatabase = checkPermission(permissionRequests.canViewMaterialsDatabase)
  // eslint-disable-next-line max-len
  const canViewMaterialsDatabaseNames = checkPermission(permissionRequests.canViewMaterialsDatabaseNames)

  const getCaseMaterialsPrices = useCallback(
    (caseId: string) =>
      call(async function getCaseMaterialsPrices () {
        if (!canViewMaterialsDatabase && !canViewMaterialsDatabaseNames) return
        const caseMaterials = await SchedulingCasesApi.getCaseMaterialsPrices(caseId)
        return caseMaterials
      }),
    [],
  )

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await getCaseMaterialsPrices(caseId)
        setCaseMaterials(res)
      } catch (_e) {
        return null
      }
    }
    getData()
  }, [canViewMaterialsDatabase, canViewMaterialsDatabaseNames, caseId, getCaseMaterialsPrices])
  return caseMaterials
}
