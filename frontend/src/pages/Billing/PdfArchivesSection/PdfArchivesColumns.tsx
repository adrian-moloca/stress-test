import {
  InvoicePDFArchiveStatus,
  dateTimeString,
  tInvoicesPdfsArchive,
} from '@smambu/lib.constants'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { trlb } from 'utilities'
import React from 'react'
import { format } from 'date-fns'
import { Box, CircularProgress } from '@mui/material'
import GenericFileDownloadButton from '../components/GenericFileDownloadButton'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

export interface IPDFArchivesRow {
  row: tInvoicesPdfsArchive
}

export const columns = [
  {
    index: 1,
    field: 'elaborationInprogress',
    headerName: '',
    width: 50,
    type: 'special',
    sortable: false,
    filterable: false,
    renderCell: ({ row: pdfArchive }: IPDFArchivesRow) => {
      const isLoading = pdfArchive.status === InvoicePDFArchiveStatus.REQUESTED
      return isLoading
        ? (
          <Box>
            <CircularProgress size={20} />
          </Box>
        )
        : null
    },
  },
  {
    index: 2,
    field: 'generatedAt',
    headerName: trlb('pdfArchiveGenerationDate'),
    width: 200,
    sortable: false,
    filterable: false,
    valueGetter: ({ row: pdfArchive }: IPDFArchivesRow) => {
      const hasBeenGenerated = pdfArchive.generatedAt != null

      if (hasBeenGenerated) {
        const generatedAtDate = new Date(pdfArchive.generatedAt!)
        return format(generatedAtDate, dateTimeString)
      }

      return '--'
    },
    type: 'date',
  },
  {
    index: 3,
    field: 'status',
    headerName: trlb('pdfArchiveGenerationStatus'),
    width: 150,
    sortable: false,
    filterable: false,
    valueGetter: ({ row: pdfArchive }: IPDFArchivesRow) => trlb(pdfArchive.status),
    type: 'string',
  },
  {
    index: 4,
    field: 'invoicesIds',
    headerName: trlb('pdfArchivesInvoicesId'),
    width: 150,
    sortable: false,
    filterable: false,
    valueGetter: ({ row: pdfArchive }: IPDFArchivesRow) => {
      const joinedInvoicesIdd = pdfArchive.invoicesIds.join(',')

      return joinedInvoicesIdd
    },
    type: 'string',
  },
  {
    index: 5,
    field: 'filenames',
    headerName: trlb('pdfArchivesFilenames'),
    width: 150,
    sortable: false,
    filterable: false,
    valueGetter: ({ row: pdfArchive }: IPDFArchivesRow) => {
      const hasFiles = pdfArchive.filenames != null

      if (hasFiles)
        return pdfArchive.filenames!.length

      return '--'
    },
    type: 'string',
  },
  {
    index: 6,
    field: 'failReason',
    headerName: trlb('pdfArchivesFailReason'),
    width: 150,
    flex: 1,
    sortable: false,
    filterable: false,
    valueGetter: ({ row: pdfArchive }: IPDFArchivesRow) => {
      const failReason = pdfArchive.failReason
      const hasFailReason = failReason != null && failReason !== ''

      if (hasFailReason)
        return failReason

      return '--'
    },
    type: 'string',
  },
  {
    index: 7,
    field: 'downloadArchives',
    headerName: trlb('pdfArchivesDownloadButtons'),
    width: 210,
    sortable: false,
    filterable: false,
    disableExport: true,
    renderCell: (params: GridRenderCellParams) => {
      const pdfArchive = params.row
      if (pdfArchive.status !== InvoicePDFArchiveStatus.READY_FOR_DOWNLOAD)
        return null

      const filenames = pdfArchive.filenames as string[]

      return (
        <Box sx={{ display: 'flex' }}>
          {filenames.map(current => (
            <GenericFileDownloadButton fileId={current} key={current} Icon={FileDownloadIcon} />
          ))}
        </Box>
      )
    },
    type: 'special',
  }
]
