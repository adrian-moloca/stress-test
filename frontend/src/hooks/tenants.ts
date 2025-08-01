import { TenantsApi } from 'api/tenants.api'
import useCall from './useCall'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION, TENANTS_ACTION } from 'store/actions'
import { useSuperAdminDownloadFile } from './bucketHooks'
import { TTenantDataFile, dateTimeSafeString, downloadFileForFE } from '@smambu/lib.constants'
import { BucketApi } from 'api/bucket.api'
import { format } from 'date-fns'

const exportsFolder = import.meta.env.VITE_EXPORTS_FOLDER

export const useResetTenant = () => {
  const call = useCall()
  const dispatch = useDispatch()

  const resetTenant = async (
    targetTenantId: string, sourceTenantId: string | undefined, zipFile: File | undefined
  ) =>
    call(async function resetTenant () {
      const safeTime = format(new Date(), dateTimeSafeString)

      if (zipFile != null) {
        const zipFileId = `${exportsFolder}/${safeTime}_${zipFile.name}`
        await BucketApi.superAdminUploadFile(zipFile as File, zipFileId)

        await TenantsApi.reset({ targetTenantId, zipFileId })
      } else {
        await TenantsApi.reset({ targetTenantId, sourceTenantId })
      }

      dispatch({
        type: TENANTS_ACTION.SET_TENANT_PROPS,
        data: {
          tenantId: targetTenantId,
          isResetting: true,
        },
      })

      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          type: 'success',
          text: 'resetTenant_success',
        },
      })

      return true
    })

  return resetTenant
}

export const useExportTenant = () => {
  const call = useCall()
  const dispatch = useDispatch()

  const exportTenant = async (tenantId: string) =>
    call(async function exportTenant () {
      try {
        dispatch({
          type: TENANTS_ACTION.SET_TENANT_PROPS,
          data: {
            tenantId,
            isExporting: true,
          },
        })

        await TenantsApi.export({ tenantId })

        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            type: 'success',
            text: 'exportTenant_success',
          },
        })

        return true
      } catch (error) {
        dispatch({
          type: TENANTS_ACTION.SET_TENANT_PROPS,
          data: {
            tenantId,
            isExporting: false,
          },
        })
        throw error
      }
    })

  return exportTenant
}

export const useDownloadTenantData = () => {
  const call = useCall()
  const superAdminDownloadFile = useSuperAdminDownloadFile()

  const downloadTenantData = async (dataFile: TTenantDataFile) =>
    call(async function downloadTenantData () {
      const fileId = dataFile.zipFileId
      const fileContent = await superAdminDownloadFile(fileId)
      const fileName = `${fileId.split('/')[1]}_${fileId.split('/')[2]}.zip`

      await downloadFileForFE(fileContent, fileName)

      return true
    })

  return downloadTenantData
}
