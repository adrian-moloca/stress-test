import React from 'react'
import { Button, IconButton } from '@mui/material'
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import EditIcon from '@mui/icons-material/Edit'
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined'
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import CloseIcon from '@mui/icons-material/Close'
import { trlb } from '../utilities'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

export const BackButton = () => {
  return (
    <Button
      onClick={() => {
        history.back()
      }}
    >
      <KeyboardBackspaceIcon sx={{ marginRight: '10px' }} />
      {trlb('commons_back')}
    </Button>
  )
}

export const CloseButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button variant='text' onClick={onClick}>
      <CloseIcon sx={{ fill: theme => theme.palette.customColors.divider }} />
    </Button>
  )
}

export const EditButton = ({ setEdit, variant, ...props }: any) => {
  return (
    <Button variant={variant || 'outlined'} onClick={() => setEdit(true)} {...props}>
      <EditIcon sx={{ mr: 1, fill: theme => theme.palette.primary.main }} />
      {trlb('commons_edit')}
    </Button>
  )
}

export const PreviousTabButton = ({ onClick, ...props }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick} {...props}>
      <NavigateBeforeOutlinedIcon sx={{ marginRight: '10px' }} />
      {trlb('commons_previous')}
    </Button>
  )
}
export const NextTabButton = ({ onClick, ...props }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick} {...props}>
      {trlb('commons_next')}
      <NavigateNextOutlinedIcon sx={{ marginLeft: '10px' }} />
    </Button>
  )
}
export const TextIconButton = ({ color, onClick, text, icon, ...props }: any) => {
  return (
    <Button onClick={onClick} variant='text' sx={{ color: { color } }} {...props}>
      {icon}
      {text}
    </Button>
  )
}

export const DefaultButton = ({ onClick, text, icon, ...props }: any) => {
  return (
    <Button onClick={onClick} {...props}>
      {icon}
      {text}
    </Button>
  )
}

export const SaveButton = ({ text, setEdit, onClick, saveAsIcon, label, ...props }: any) => {
  const handleClick = () => {
    if (onClick) onClick()

    if (setEdit) setEdit(false)
  }

  return (
    <Button variant='contained' color='secondary' onClick={handleClick} {...props}>
      <SaveAsIcon sx={{ mr: 1, fill: theme => theme.palette.primary.contrastText }} />
      {saveAsIcon ? text : label || trlb('commons_save')}
    </Button>
  )
}

export const DeleteButton = ({ onClick, disabled }: any) => {
  return (
    <Button onClick={onClick} variant='contained' color='error' disabled={disabled}>
      {trlb('commons_delete')}
    </Button>
  )
}

export const DownloadFileButton = ({ onClick }: any) => {
  return (
    <IconButton onClick={onClick}>
      <FileDownloadIcon sx={{ fill: theme => theme.palette.primary }} />
    </IconButton>
  )
}
