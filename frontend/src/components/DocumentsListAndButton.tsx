import {
  CaseForm,
  FileWithId
} from '@smambu/lib.constants'
import DeleteIcon from '@mui/icons-material/Delete'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import {
  Box,
  Grid,
  IconButton,
} from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { FormikProps } from 'formik'
import React, { ChangeEvent, useState } from 'react'
import { v4 } from 'uuid'
import { trlb } from '../utilities/translator/translator'
import { DefaultButton, DownloadFileButton } from './Buttons'
import { SectionSubtitle, Space20 } from './Commons'
import { FlexDataTable } from './FlexCommons'
import ErrorDialog from './DocumentsListAndButton/ErrorDialog'
import { useCall } from 'hooks'

export const getCaseFilesCount = (form: FormikProps<CaseForm>) =>
  (form.values.uploads?.length ?? 0) +
  (form.values.documentsToUpload?.length ?? 0) +
  (form.values.checkinUploads?.length ?? 0) +
  (form.values.checkinDocumentsToUpload?.length ?? 0) +
  (form.values.intraOpUploads?.length ?? 0) +
  (form.values.intraOpDocumentsToUpload?.length ?? 0) +
  (form.values.checkoutUploads?.length ?? 0) +
  (form.values.checkoutDocumentsToUpload?.length ?? 0)

interface FileRow {
  id: string
  name: string
}

const DocumentsListAndButton = ({
  edit,
  initialFiles,
  handleUploadDocument,
  handleDeleteDocument,
  downloadEnabled,
  deleteEnabled,
  allowedFileTypes,
  getAllFilesCount,
  checkIfMaxiumFilesCountReached,
  checkIfMaxiumSizeReached,
  checkIfFileFormatIsAllowed,
  maxiumFilesCount,
  maxiumSize,
  values,
  downloadFile,
}: {
  initialFiles?: {
    fileId: string
    name: string
  }[]
  edit: boolean
  handleUploadDocument: (files: FileWithId[]) => void
  handleDeleteDocument?: (id: string) => void
  downloadEnabled: boolean
  deleteEnabled: boolean
  allowedFileTypes?: string[]
  getAllFilesCount: () => number
  checkIfMaxiumFilesCountReached: boolean
  checkIfMaxiumSizeReached: boolean
  checkIfFileFormatIsAllowed: boolean
  maxiumFilesCount: number
  maxiumSize: number
  values?: FileWithId[] | null
  downloadFile: (id: string, name: string) => void
}) => {
  const [rows, setRows] = React.useState<FileRow[]>([])
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const call = useCall()

  React.useEffect(() => {
    const parsedInitialFiles =
      initialFiles?.map(current => ({
        id: current.fileId,
        name: current.name,
      })) ?? []

    const parsedValues =
      values?.map(current => ({
        id: current.id,
        name: current.file.name,
      })) ?? []

    const totalValues = [...parsedInitialFiles, ...parsedValues]

    setRows(totalValues)
  }, [initialFiles, values])

  const inputRef = React.useRef<any>(null)

  const handleDownload = async (value: GridRenderCellParams) =>
    call(async function handleDownload () {
      await downloadFile(value.row.id, value.row.name)
    })

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const filesList = event.currentTarget.files
    // this should never happen, but again: better safe than sorry
    if (filesList === null) throw new Error('Null file selected')

    // this should never happen, but again: better safe than sorry
    if (filesList.length === 0) throw new Error('No files selected')

    const newFilesArray: FileWithId[] = []

    for (let i = 0; i < filesList.length; i++) {
      const currentFile = filesList.item(i)
      const enrichedFile = { file: currentFile!, id: v4() }

      newFilesArray.push(enrichedFile)
    }

    const filesCount = getAllFilesCount?.()

    if (checkIfMaxiumFilesCountReached && maxiumFilesCount &&
      filesCount + newFilesArray.length > maxiumFilesCount) {
      setAlertMessage(trlb('too_many_files_error'))
      inputRef.current.value = ''
      return
    }
    if (
      checkIfMaxiumSizeReached &&
      maxiumSize &&
      newFilesArray
        .some(item => (item?.file.size ? item?.file.size / (1024 * 1024) : 0) > maxiumSize)
    ) {
      setAlertMessage(trlb('file_too_big_error'))
      inputRef.current.value = ''
      return
    }

    if (checkIfFileFormatIsAllowed && newFilesArray
      .some(item => !allowedFileTypes?.includes(item?.file?.type))) {
      setAlertMessage(trlb('file_not_allowed_error'))
      inputRef.current.value = ''
      return
    }

    await handleUploadDocument(newFilesArray)

    setRows([
      ...rows,
      ...newFilesArray.map(item => ({
        id: item.id,
        name: item.file.name,
      })),
    ])

    inputRef.current.value = ''
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: trlb('file_name'), flex: 1 },
    {
      field: 'actions',
      headerName: '',
      flex: 1,
      renderCell: value => {
        return (
          <div style={{ display: 'flex', width: '100%', justifyContent: 'end', alignItems: 'center' }}>
            {deleteEnabled && edit && (
              <IconButton onClick={() => handleDeleteFile(value)}>
                <DeleteIcon sx={{ fill: 'red' }} />
              </IconButton>
            )}
            {downloadEnabled && <DownloadFileButton onClick={() => handleDownload(value)} />}
          </div>
        )
      },
    },
  ]

  const handleDeleteFile = (value: GridRenderCellParams) => {
    handleDeleteDocument?.(value.row.id)
  }

  return (
    <Grid container>
      {edit
        ? (
          <>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <input type='file' style={{ display: 'none' }} ref={inputRef} onChange={handleUpload} name='uploads' />
              <DefaultButton
                icon={<FileUploadIcon sx={{ marginRight: '10px' }} />}
                text={trlb('upload_documents')}
                onClick={() => inputRef.current?.click?.()}
              />
            </Grid>
            <Space20 />
          </>
        )
        : null}
      <SectionSubtitle text={trlb('uploaded_documents')} />

      <Box sx={{ height: '400px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <FlexDataTable {...{ rows, columns }} />
      </Box>
      <ErrorDialog alertMessage={alertMessage} setAlertMessage={setAlertMessage} />
    </Grid>
  )
}

export default DocumentsListAndButton
