import { getDateTimeName, tEditScheduleNoteDto, tScheduleNote } from '@smambu/lib.constants'
import { Box, TextField, Typography } from '@mui/material'
import StandardDialog from 'components/StandardDialog'
import React from 'react'
import { trlb } from 'utilities'

interface ScheduleNoteBulletProps {
  scheduleNote: tScheduleNote
  canEditScheduleNotes: boolean
  editScheduleNote: (data: tEditScheduleNoteDto) => void
  isLoading: boolean
  timeZone: string
}

const ScheduleNoteBullet = ({
  scheduleNote, canEditScheduleNotes, editScheduleNote, isLoading, timeZone
}: ScheduleNoteBulletProps) => {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(scheduleNote.text)
  const timeName = getDateTimeName(
    scheduleNote.timestamp,
    scheduleNote.timeStep,
    timeZone
  )

  const onClose = () => {
    setOpen(false)
    setText(scheduleNote.text)
  }

  const onConfirm = async () => {
    await editScheduleNote({
      scheduleNoteId: scheduleNote._id,
      text,
    })
    setOpen(false)
  }

  return (
    <>
      <Box
        sx={{
          backgroundColor: theme => theme.palette.background.paper,
          borderRadius: theme => theme.constants.radius,
          py: 0.5,
          px: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 1,
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='caption' fontWeight='bold'>{timeName}</Typography>
          <Typography variant='caption' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {scheduleNote.text}
          </Typography>
        </Box>
      </Box>
      <StandardDialog
        open={open}
        onClose={onClose}
        onConfirm={canEditScheduleNotes ? onConfirm : undefined}
        textKey={timeName}
        confirmDisabled={isLoading || !text}
      >
        {canEditScheduleNotes
          ? (
            <TextField
              value={text}
              onChange={e => setText(e.target.value)}
              sx={{ width: 500 }}
              multiline
              rows={10}
              variant='outlined'
              autoFocus
              placeholder={trlb('scheduleNotes_text')}
            />
          )
          : (
            <Box sx={{ display: 'flex', width: 500, maxHeight: 500, gap: 1, overflow: 'auto', pr: 1 }}>
              <Typography>{scheduleNote.text}</Typography>
            </Box>
          )}
      </StandardDialog>
    </>
  )
}

export default ScheduleNoteBullet
