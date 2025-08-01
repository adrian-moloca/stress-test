import React from 'react'
import { Typography } from '@mui/material'

const text = import.meta.env.VITE_ENVIRONMENT_NAME
const colorValue = import.meta.env.VITE_ENVIRONMENT_BADGE_COLOR

const colorSet = colorValue !== '' && colorValue != null
const textSet = text !== '' && text != null

const color = `#${colorValue}`

const EnvBadge = () => {
  if (!colorSet || !textSet) return null

  return (
    <Typography
      sx={{
        borderRadius: theme => theme.constants.radius,
        backgroundColor: color,
        color: theme => theme.palette.getContrastText(color),
        mr: 2,
        px: 1,
        fontWeight: 'bold',
        height: 'fit-content',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </Typography>
  )
}

export default EnvBadge
