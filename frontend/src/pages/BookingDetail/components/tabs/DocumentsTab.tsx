import React from 'react'
import { CaseForm, downloadFileForFE, getCaseContract, permissionRequests } from '@smambu/lib.constants'
import { Box } from '@mui/material'
import { SectionTitle } from 'components/Commons'
import DocumentsListAndButton, { getCaseFilesCount } from 'components/DocumentsListAndButton'
import { FormikProps } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useAppSelector } from 'store'
import { trlb } from 'utilities'

const DocumentsTab = ({ edit, form }: { edit: boolean; form: FormikProps<CaseForm> }) => {
  const canDeleteFiles = true
  const fileConfigs: any = useAppSelector(state => state.configs.fileConfigs)
  const allowedFileTypes = import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') ?? []
  const checkPermission = useGetCheckPermission()
  const opStandardId = form.values.bookingSection?.opStandardId

  const contracts = useAppSelector(state => state.contracts)
  const contract = getCaseContract({
    caseForm: form.values,
    contracts,
  })
  const opStandard = contract?.opStandards?.[opStandardId]
  const userCanUploadDocuments = checkPermission(permissionRequests.canUploadDocuments)

  const downloadFile = async (id: string, name: string) => {
    const file = form.values.documentsToUpload.find((file: any) => file.id === id)
    if (file)
      await downloadFileForFE(file.file, name)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <SectionTitle text={trlb('booking_tab_documents')} />
      <DocumentsListAndButton
        edit={edit &&
        opStandard?.bookingSection?.userCanUploadDocuments &&
        userCanUploadDocuments}
        handleUploadDocument={newFilesArray =>
          form.setFieldValue('documentsToUpload', [...(form.values.documentsToUpload ?? []), ...newFilesArray])
        }
        downloadEnabled={true}
        downloadFile={downloadFile}
        deleteEnabled={canDeleteFiles}
        allowedFileTypes={allowedFileTypes}
        getAllFilesCount={() => getCaseFilesCount(form)}
        checkIfMaxiumFilesCountReached={true}
        checkIfMaxiumSizeReached={true}
        checkIfFileFormatIsAllowed={true}
        maxiumFilesCount={fileConfigs?.numberUploadLimit}
        maxiumSize={fileConfigs?.sizeUploadLimit}
        values={form.values.documentsToUpload}
        handleDeleteDocument={id => {
          const values = form.values.documentsToUpload
          form.setFieldValue(
            'documentsToUpload',
            Array.isArray(values) ? values?.filter((item: any) => item.id !== id) : [],
          )
        }}
      />
    </Box>
  )
}

export default DocumentsTab
