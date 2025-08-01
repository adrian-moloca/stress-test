import React from 'react'
import { Box } from '@mui/material'
import { trlb } from 'utilities'
import { FlexDataTable } from 'components/FlexCommons'
import { useFetchPDFArchives } from 'hooks/pdfArchiveHooks'
import { columns } from './PdfArchivesColumns'

const paginationLimit = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT

if (isNaN(paginationLimit)) {
  const errorMessage = trlb('pdfPaginationLimitNotNumberError')

  throw new Error(errorMessage)
}

const pageSize = Number(paginationLimit)

const PdfArchivesTable = () => {
  const {
    pdfArchives,
    currentPage,
    total,
    onPageChange,
    onPageSizeChange,
  } = useFetchPDFArchives(0, pageSize)

  return (
    <Box>
      <FlexDataTable
        rows={pdfArchives}
        columns={columns}
        pagination
        onPageChange={onPageChange}
        rowCount={total}
        getRowId={(row: any) => row._id}
        paginationMode={'server'}
        page={currentPage}
        sortingMode={'server'}
        onPageSizeChange={onPageSizeChange}
        autoHeight
      />
    </Box>
  )
}

export default PdfArchivesTable
