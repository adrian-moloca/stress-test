import { Box, SxProps } from '@mui/material'
import React, { ReactNode } from 'react'

type Props = {
  children: ReactNode | ReactNode[]
  sx?: SxProps
}

const CellAlignWrapper = ({ children, sx = {} }: Props) => {
  const combinedSx = {
    width: '100%',
    height: '40%',
    marginTop: '5px',
    ...sx
  }

  return (
    <Box
      sx={combinedSx}
    >
      {children}
    </Box>
  )
}

export default CellAlignWrapper
