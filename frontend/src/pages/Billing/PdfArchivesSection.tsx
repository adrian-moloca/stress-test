import { PageContainer, PageHeader, Space10 } from 'components/Commons'
import React from 'react'
import { trlb } from 'utilities'
import PdfArchivesTable from './PdfArchivesSection/PdfArchivesTable'

export const BILLING_TAB_IDS = {
  CASES: 1,
  BILLING: 2,
}

const PdfArchivesSection = () => {
  return (
    <PageContainer sx={{ flex: 1 }}>
      <PageHeader pageTitle={trlb('pdfArchiveSectionHeader')} />
      <Space10 />
      <PdfArchivesTable />
    </PageContainer>
  )
}

export default PdfArchivesSection
