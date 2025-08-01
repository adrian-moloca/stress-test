import { Box, TextField } from '@mui/material'
import { Panel } from 'components/Commons'
import React, { useState } from 'react'
import { trlb } from 'utilities'

const SurgeryNotes = ({
  readOnlyText,
  text,
  handleTextChange,
  edit,
}: {
  readOnlyText?: string
  text?: string
  edit: boolean
  // eslint-disable-next-line max-len
  handleTextChange: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => Promise<void>
}) => {
  const [notes, setNotes] = useState(text)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)

  return (
    <Panel>
      <Box
        display='flex'
        flexDirection='column'
        sx={{
          width: '100%',
        }}
      >
        <TextField
          multiline
          value={readOnlyText}
          disabled={true}
          variant='outlined'
          placeholder={trlb('cases_notes_readOnlyPlaceholder')}
        />
        <TextField
          multiline
          rows={4}
          value={notes}
          onChange={onChange}
          onBlur={handleTextChange}
          variant='outlined'
          placeholder={trlb('cases_notes_text_placeHolder')}
          disabled={!edit}
        />
      </Box>
    </Panel>
  )
}

export default SurgeryNotes
