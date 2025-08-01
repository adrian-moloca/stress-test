import { Box, Button, Typography } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'

const UploadBox = ({
  onDownload,
  handleFile,
  lastUpdate,
}: {
  onDownload: () => void
  handleFile: (file: File) => void
  lastUpdate: Date | null
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 8 }}
    >
      <Typography variant='h5'>{trlb('ur_configs_uploadText')}</Typography>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-evenly', alignItems: 'flex-start' }} >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Button
            variant='outlined'
            color='primary'
            disabled={lastUpdate == null}
            onClick={e => {
              e.stopPropagation()
              onDownload()
            }}
          >
            {trlb('commons_download')}
          </Button>
          <Typography variant='body1'>
            {trlb('ur_configs_lastUpdate', { date: lastUpdate ? lastUpdate.toLocaleString() : 'N/A' })}
          </Typography>
        </Box>
        <Button
          variant='contained' color='primary' onClick={() => inputRef.current?.click?.()}>
          <input
            type='file'
            accept='.json'
            hidden
            onChange={e => {
              if (e.target.files?.[0]) handleFile(e.target.files?.[0])
            }}
            ref={inputRef}
          />
          {trlb('commons_upload')}
        </Button>
      </Box>
    </Box>
  )
}

export default UploadBox
