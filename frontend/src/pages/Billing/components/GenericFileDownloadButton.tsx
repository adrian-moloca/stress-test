import { IconButton, SvgIconTypeMap } from '@mui/material'
import { useDownloadFile } from 'hooks/bucketHooks'
import React from 'react'
import { downloadFileForFE } from '@smambu/lib.constants'
import { OverridableComponent } from '@mui/material/OverridableComponent'

interface IGenericFileDownloadButtonProps {
  fileId: string
  Icon: OverridableComponent<SvgIconTypeMap> & { muiName: string }
}

const GenericFileDownloadButton: React.FC<IGenericFileDownloadButtonProps> = ({ fileId, Icon }) => {
  const downloadFromBucket = useDownloadFile()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    downloadFromBucket(fileId).then(fileContent => {
      const splits = fileId.split('/')
      const lastSplit = splits.length - 1
      const fileName = splits[lastSplit]

      downloadFileForFE(fileContent, fileName)
    })
  }

  return (
    <IconButton onClick={handleClick}>
      <Icon />
    </IconButton>
  )
}

export default GenericFileDownloadButton
