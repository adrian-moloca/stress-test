import { Box } from '@mui/material'
import { Panel, SectionTitle } from 'components/Commons'
import React from 'react'
import { useGetScreenSize } from 'hooks/uiHooks'
import { trlb } from 'utilities'

const HIDE_SIDEBAR_RESOLUTION = import.meta.env.VITE_HIDE_SIDEBAR_RESOLUTION

const SectionWrapper = ({
  title,
  titleIcon,
  children,
}: {
  title: string
  titleIcon?: React.ReactNode
  children: React.ReactNode
}) => {
  const { width } = useGetScreenSize()
  return (
    <Panel
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        textAlign: 'center',
        px: width < HIDE_SIDEBAR_RESOLUTION ? 0 : 2,
        py: 2,
      }}
    >
      {titleIcon
        ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 1 }}>
            {titleIcon}
            <SectionTitle text={trlb(title)} sx={{ mt: 0, width: 'fit-content' }} />
          </Box>
        )
        : (
          <SectionTitle text={trlb(title)} sx={{ mt: 0 }} />
        )}
      {children}
    </Panel>
  )
}

export default SectionWrapper
