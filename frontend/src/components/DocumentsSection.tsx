import {
  CaseFileUploadSections,
  CaseForm,
  downloadFileForFE,
  FileDocument,
  FileWithId,
  NamedCaseFileToDelete,
  tCaseFileSections,
} from '@smambu/lib.constants'
import { CaseFileReference } from '@smambu/lib.constantsjs'
import { FormikProps } from 'formik'
import {
  useUploadCaseDocuments,
  useUploadCheckinDocuments,
  useUploadCheckoutDocuments,
  useUploadIntraOpDocuments,
} from 'hooks'
import { useDownloadFile, useGetFilesinfo } from 'hooks/bucketHooks'
import { useDeleteFiles } from 'hooks/caseshooks'
import React, { useEffect, useState } from 'react'
import { useAppSelector } from 'store'
import { v4 } from 'uuid'
import DocumentDeleteModal from './DocumentDeleteModal'
import DocumentsListAndButton, { getCaseFilesCount } from './DocumentsListAndButton'

const isCaseFileReferenceArray = (value: any): value is CaseFileReference[] => {
  return Array.isArray(value) && value.every(item => item?.fileId)
}

const isFilesArray = (value: any): value is File[] => {
  return Array.isArray(value) && value.every(item => item instanceof File)
}

export const DocumentsSection = ({
  form,
  uploadsField,
  documentsToUploadField,
  canDownloadDocuments,
  canViewDocuments,
  edit,
}: {
  form: FormikProps<CaseForm>
  uploadsField: keyof CaseForm
  documentsToUploadField: keyof CaseForm
  canDownloadDocuments: boolean
  canViewDocuments: boolean
  edit: boolean
}) => {
  const allowedFileTypes = import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') ?? []

  const deleteFiles = useDeleteFiles()
  const uploadCheckinFiles = useUploadCheckinDocuments()
  const uploadCaseDocuments = useUploadCaseDocuments()
  const uploadCheckoutDocuments = useUploadCheckoutDocuments()
  const uploadIntraOpDocuments = useUploadIntraOpDocuments()
  const downloadFile = useDownloadFile()

  const [files, setFiles] = useState<{ fileId: string, name: string }[]>([])
  const [fileToDelete, setFileToDelete] = useState<NamedCaseFileToDelete | null>(null)

  const getFilesInfo = useGetFilesinfo()
  const fileConfigs: any = useAppSelector(state => state.configs.fileConfigs)

  const documentsToUpload = form.values[documentsToUploadField]
  const uploads = form.values[uploadsField]
  const canDeleteFiles = true
  const caseId = form.values.caseId

  const closeDeleteModal = () => setFileToDelete(null)

  const deleteTargetFile = async () => {
    await deleteFiles(form.values.caseId, [fileToDelete!])
    const values = form.values[uploadsField]
    const newValues = Array.isArray(values)
      ? values?.filter((item: any) => item.fileId !== fileToDelete?.fileId)
      : []

    form.setFieldValue(uploadsField, newValues)
    closeDeleteModal()
  }

  const uploadFilesArray = async (filesArray: FileWithId[], section: tCaseFileSections) => {
    let fileReferences: CaseFileReference[] | { error: Error } = []
    switch (section) {
      case CaseFileUploadSections.documentsToUpload:
        fileReferences = await uploadCaseDocuments(
          caseId,
          filesArray.map(item => item.file),
        )
        break

      case CaseFileUploadSections.checkinDocumentsToUpload:
        fileReferences = await uploadCheckinFiles(
          caseId,
          filesArray.map(item => item.file),
        )
        break

      case CaseFileUploadSections.checkoutDocumentsToUpload:
        fileReferences = await uploadCheckoutDocuments(
          caseId,
          filesArray.map(item => item.file),
        )

        break

      case CaseFileUploadSections.intraOpDocumentsToUpload:
        fileReferences = await uploadIntraOpDocuments(
          caseId,
          filesArray.map(item => item.file),
        )
        break

        // this should never happen, but better safe than sorry
      default:
        throw new Error(`File section ${section} is not supported`)
    }
    if ('error' in fileReferences) throw fileReferences.error

    form.setFieldValue(uploadsField,
      [...((form.values[uploadsField] as any) ?? []), ...fileReferences])
  }

  useEffect(() => {
    const getData = async () => {
      if (!isCaseFileReferenceArray(uploads)) return

      if (uploads.length) {
        const files = await getFilesInfo({
          filesIds: uploads,
        }) as FileDocument[]

        const filteredFiles = files.filter(
          file => !form.values.filesToDelete?.find(item => item.fileId === file.fileId),
        )

        const filesSelected = isFilesArray(documentsToUpload)
          ? documentsToUpload?.map((file: File) => ({ name: file.name, fileId: v4() }))
          : []
        setFiles([...filteredFiles, ...filesSelected])
      } else {
        setFiles([])
      }
    }

    if (canViewDocuments) getData()
  }, [uploads, documentsToUpload, canViewDocuments, setFiles, form.values.filesToDelete])

  const handleDownload = async (id: string, name: string) => {
    let blobItem: Blob = {} as Blob
    blobItem = await downloadFile(id)
    await downloadFileForFE(blobItem, name)
  }

  if (!canViewDocuments) return null

  return (
    <>
      <DocumentDeleteModal fileToDelete={fileToDelete}
        deleteFun={deleteTargetFile}
        closeFun={closeDeleteModal} />
      <DocumentsListAndButton
        edit={edit}
        handleUploadDocument={async (newFilesArray: FileWithId[]) => {
          await uploadFilesArray(newFilesArray, documentsToUploadField as tCaseFileSections)
        }}
        initialFiles={files}
        downloadEnabled={canDownloadDocuments}
        downloadFile={handleDownload}
        deleteEnabled={canDeleteFiles}
        allowedFileTypes={allowedFileTypes}
        getAllFilesCount={() => getCaseFilesCount(form)}
        checkIfMaxiumFilesCountReached
        checkIfMaxiumSizeReached
        checkIfFileFormatIsAllowed
        maxiumFilesCount={fileConfigs?.numberUploadLimit}
        maxiumSize={fileConfigs?.sizeUploadLimit}
        values={form.values[documentsToUploadField] as FileWithId[]}
        handleDeleteDocument={id => {
          const targetFile = files.find(current => current.fileId === id)
          const fileToDelete: NamedCaseFileToDelete = {
            fileId: id,
            // @ts-expect-error have i said how types are a mess atm?
            fileSection: uploadsField,
            // @ts-expect-error have i said how types are a mess atm?
            displayName: targetFile?.name,
          }

          setFileToDelete(fileToDelete)
        }}
      />
    </>
  )
}
