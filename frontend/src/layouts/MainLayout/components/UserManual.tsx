import { downloadFileForFE, userManualFileName } from '@smambu/lib.constants'
import { Help } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import { useDownloadCommonFile } from 'hooks/bucketHooks'
import React from 'react'

const UserManual = () => {
  const downloadCommonFile = useDownloadCommonFile()

  const onDownload = async () => {
    const blob = await downloadCommonFile(userManualFileName)
    await downloadFileForFE(blob, userManualFileName)
  }

  return (
    <IconButton onClick={onDownload}>
      <Help />
    </IconButton>
  )
}

export default UserManual
