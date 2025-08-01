import { useDispatch } from 'react-redux'
import useCall from './useCall'
import { useSetCase } from './caseshooks'
import { GLOBAL_ACTION } from 'store/actions'
import { ToastType, formatCasesResponse, serializePatient } from '@smambu/lib.constants'
import { SchedulingCasesApi } from 'api/schedulingCases.api'
import { serialize } from 'object-to-formdata'

export const useCreateBookingRequest = () => {
  const dispatch = useDispatch()
  const call = useCall()
  const setCase = useSetCase()
  const uploadCaseDocuments = useUploadCaseDocuments()

  return (values: any) =>
    call(async function createBookingRequest () {
      let uploads = []
      const caseResponse = await SchedulingCasesApi.createCase({
        ...values,
        bookingPatient: {
          ...serializePatient(values.bookingPatient),
        },
      })
      if (values?.documentsToUpload?.length > 0)
        uploads = await uploadCaseDocuments(
          caseResponse.caseId,
          values.documentsToUpload.map(item => item.file),
        )
      setCase({
        ...formatCasesResponse([caseResponse])[0],
        uploads,
      })
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          type: ToastType.success,
          text: 'toastSuccess_newBookingRequest',
        },
      })
      return caseResponse
    })
}

export const useUploadCheckinDocuments = () => {
  const call = useCall()
  return async (caseId: string, files: File[]) => call(async function uploadCheckinDocuments () {
    const form = serialize({ documentsToUpload: files })
    const res = await SchedulingCasesApi.uploadCheckinDocuments(caseId, form)
    return res
  })
}

export const useUploadCaseDocuments = () => {
  const call = useCall()
  return async (caseId: string, files: File[]) => call(async function useUploadCaseDocuments () {
    const form = serialize({ documentsToUpload: files })
    const res = await SchedulingCasesApi.uploadCaseDocuments(caseId, form)
    return res
  })
}

export const useUploadCheckoutDocuments = () => {
  const call = useCall()
  return async (caseId: string, files: File[]) =>
    call(async function useUploadCheckoutDocuments () {
      const form = serialize({ documentsToUpload: files })
      const res = await SchedulingCasesApi.uploadCheckoutDocuments(caseId, form)
      return res
    })
}

export const useUploadIntraOpDocuments = () => {
  const call = useCall()
  return async (caseId: string, files: File[]) => call(async function useUploadIntraOpDocuments () {
    const form = serialize({ documentsToUpload: files })
    const res = await SchedulingCasesApi.uploadIntraOpDocuments(caseId, form)
    return res
  })
}

export const useCloseCase = () => {
  const call = useCall()

  return (caseId: string) =>
    call(async function closeCase () {
      await SchedulingCasesApi.closeCase(caseId)
    })
}

export const useReOpenCase = () => {
  const call = useCall()

  return (caseId: string) =>
    call(async function reOpenCase () {
      await SchedulingCasesApi.reOpenCase(caseId)
    })
}
