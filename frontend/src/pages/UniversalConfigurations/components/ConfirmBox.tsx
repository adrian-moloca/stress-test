import { Box, Button, TextField, Typography } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'

const ConfirmBox = ({
  tenantName,
  onConfirm,
  onReset,
}: {
  tenantName: string,
  onConfirm: () => void
  onReset: () => void
}) => {
  const [text, setText] = React.useState<string>('')
  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 8 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant='h5'>{trlb('ur_configs_confirmTitle', { tenantName })}</Typography>
        <Typography variant='h6'>{trlb('ur_configs_confirmText')}</Typography>
      </Box>
      <TextField
        value={text}
        onChange={e => setText(e.target.value)}
        label={trlb('commons_tenant')}
        variant='outlined'
      />
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-evenly' }}>
        <Button variant='outlined' color='primary' onClick={onReset}>
          {trlb('commons_cancel')}
        </Button>
        <Button variant='contained' color='primary' onClick={onConfirm} disabled={text !== tenantName}>
          {trlb('commons_confirm')}
        </Button>
      </Box>
    </Box>
  )
}

export default ConfirmBox
