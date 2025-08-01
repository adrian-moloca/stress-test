import React from 'react'
import { Box, Typography } from '@mui/material'

const ItemNotFound = ({ message }: { message: string }) => {
  return (
    <Box display='flex' justifyContent='center' alignItems='center' height='100%'>
      <Typography variant='h6'>{message}</Typography>
    </Box>
  )
}

export default ItemNotFound
