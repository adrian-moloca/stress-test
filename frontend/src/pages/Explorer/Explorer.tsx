import { PageContainer, PageHeader, Space20 } from 'components/Commons'
import { useGetExplorerData } from 'hooks/explorerHooks'
import React from 'react'
import { useAppSelector } from 'store'
import { trlb } from 'utilities'
import FilterBar from './components/FilterBar'
import Widgets from './components/Widgets'
import { Box, Typography } from '@mui/material'

const Explorer = () => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const { data } = useGetExplorerData()
  const { startDate, endDate } = useAppSelector(state => state.explorer)

  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('explorer_title')} />
      <FilterBar startDate={startDate} endDate={endDate} />
      <Space20 />
      {data != null
        ? (
          <Widgets
            data={data}
            startDate={startDate}
            endDate={endDate}
          />
        )
        : null}
      {!isLoading && data == null
        ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography variant='h5'>
              {trlb('explorer_noData_warning')}
            </Typography>
          </Box>
        )
        : null}
    </PageContainer>
  )
}

export default Explorer
