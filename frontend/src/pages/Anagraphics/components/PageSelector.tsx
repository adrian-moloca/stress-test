import React from 'react'
import { useAnagraphicsContext } from './AnagraphicContext'
import { Box, IconButton, MenuItem, TextField } from '@mui/material'
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material'
import { defaultStyles } from 'ThemeProvider'

const PageSelector = () => {
  const { page, setPage, rowCount, pageSize, setPageSize, pageSizes } = useAnagraphicsContext()
  // eslint-disable-next-line @stylistic/no-mixed-operators
  const firstRow = page * pageSize + 1
  // eslint-disable-next-line @stylistic/no-mixed-operators
  const lastRow = page * pageSize + pageSize < rowCount ? page * pageSize + pageSize : rowCount

  return (
    <>
      <TextField
        select
        size='small'
        value={pageSize}
        onChange={e => setPageSize(Number(e.target.value))}
        sx={{ width: 60, mr: 2 }}
        variant='standard'
        SelectProps={{
          MenuProps: defaultStyles.MenuProps,
        }}
      >
        {pageSizes.map(value => (
          <MenuItem key={value} value={value} sx={defaultStyles.MenuItemSx}>
            {value}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: 'flex', alignItems: 'enter', gap: 1 }}>
        {firstRow}-{lastRow} of {rowCount}
        <IconButton size='small' disabled={page <= 0} onClick={() => setPage(page - 1)} sx={{ p: 0.5 }}>
          <ArrowBackIos sx={{ fontSize: '0.9rem' }} />
        </IconButton>
        <IconButton
          size='small'
          onClick={() => setPage(page + 1)}
          sx={{ p: 0.5 }}
          // eslint-disable-next-line @stylistic/no-mixed-operators
          disabled={page >= rowCount / pageSize - 1}
        >
          <ArrowForwardIos sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>
    </>
  )
}

export default PageSelector
