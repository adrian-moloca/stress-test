import React, { useCallback } from 'react'
import { PageContainer, PageHeader } from 'components/Commons'
import { routes } from 'routes/routes'

import { useNavigate } from 'react-router-dom'
import { useAppSelector } from 'store'
import { Box, Button, Typography } from '@mui/material'
import { trlb } from 'utilities'

const ForbiddenPage = ({ noRedirect }: { noRedirect?: boolean }) => {
  const navigate = useNavigate()
  const goToDashboard = useCallback(() => navigate(routes.dashboard), [navigate])

  const isLoading = useAppSelector(state => state.global.loading.length)
  React.useEffect(() => {
    if (!noRedirect && !isLoading) {
      const timer = setTimeout(() => goToDashboard(), 10000)

      return () => clearTimeout(timer)
    }
  }, [goToDashboard, isLoading, noRedirect])

  if (isLoading) return null

  const text = trlb('commons_forbidden_text')
  const redirectText = trlb('commons_forbidden_redirect_text')
  const redirectLabel = trlb('commons_forbidden_redirect_button')
  const redirectVisibility = noRedirect ? 'hidden' : 'block'

  return (
    <PageContainer>
      <PageHeader pageTitle='Forbidden'></PageHeader>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 4,
          marginX: 10,
          gap: 20,
        }}
      >
        <Typography variant='h5'>{text}</Typography>
        <Box
          sx={{
            display: redirectVisibility,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Typography variant='h5'>{redirectText}</Typography>
            <Button onClick={goToDashboard}>{redirectLabel}</Button>
          </Box>
        </Box>
      </Box>
    </PageContainer>
  )
}
export default ForbiddenPage
