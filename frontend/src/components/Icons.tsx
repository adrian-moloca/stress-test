import { Fullscreen, FullscreenExit, PersonPinCircle, Warning } from '@mui/icons-material'
import { SxProps } from '@mui/material'
import React from 'react'

export const WarningIcon = ({ sx, variant = 'error' }: { sx?: SxProps; variant?: 'error' | 'warning' | 'primary' }) => (
  <Warning sx={{ fill: theme => theme.palette[variant].main, ...(sx ?? {}) }} />
)

export const FullScreenEnterIcon = ({
  sx,
  variant = 'primary',
}: {
  sx?: SxProps
  variant?: 'error' | 'warning' | 'primary'
}) => <Fullscreen sx={{ fill: theme => theme.palette[variant].main, ...(sx ?? {}) }} />

export const FullScreenExitIcon = ({
  sx,
  variant = 'primary',
}: {
  sx?: SxProps
  variant?: 'error' | 'warning' | 'primary'
}) => <FullscreenExit sx={{ fill: theme => theme.palette[variant].main, ...(sx ?? {}) }} />

export const PersonPinCircleIcon = ({ sx, variant = 'primary' }: { sx?: SxProps; variant?: 'disabled' | 'primary' }) =>
  variant === 'disabled'
    ? (
      <PersonPinCircle sx={{ fill: theme => theme.palette.grey[700], ...(sx ?? {}) }} />
    )
    : (
      <PersonPinCircle sx={{ fill: theme => theme.palette[variant]?.main, ...(sx ?? {}) }} />
    )
