import { CaseStatus } from '@smambu/lib.constants'
import { Box, Typography } from '@mui/material'
import { trlb } from 'utilities'
import React from 'react'

const ColorLegend = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', m: 2, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant='subtitle1'>{trlb('colorsLegend_title')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: '15px',
            height: '15px',
            borderRadius: theme => theme.constants.radius,
            backgroundColor: theme => theme.palette.customColors[CaseStatus.CONFIRMED],
            marginRight: '10px',
            marginLeft: '20px',
          }}
        />
        <Typography variant='subtitle1'>{trlb('anestScheduleColorsLegend_assigned')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: '15px',
            height: '15px',
            borderRadius: theme => theme.constants.radius,
            backgroundColor: theme => theme.palette.customColors[CaseStatus.ON_HOLD],
            marginRight: '10px',
            marginLeft: '20px',
          }}
        />
        <Typography variant='subtitle1'>{trlb('anestScheduleColorsLegend_unassigned')}</Typography>
      </Box>
    </Box>
  )
}

export default ColorLegend
