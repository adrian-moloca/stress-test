import { ILimitedCase, calendarNotesTypes, calendarNotesMaxLength, calendarNotesSettings } from '@smambu/lib.constants'
import { Edit, NoteAdd } from '@mui/icons-material'
import { Box, IconButton, TextField, Typography } from '@mui/material'
import StandardDialog from 'components/StandardDialog'
import { useEditCaseCalendarNotes } from 'hooks/caseshooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { trlb } from 'utilities'

type CaseNoteProps = {
  caseItem: ILimitedCase
  type: calendarNotesTypes
}

const CaseNotes = ({ caseItem, type }: CaseNoteProps) => {
  const settings = calendarNotesSettings[type]
  const notes = caseItem.bookingSection[type]
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(notes ?? '')
  const editCalendarNotes = useEditCaseCalendarNotes()

  const checkPermission = useGetCheckPermission()
  const canViewCalendarNotes = checkPermission(settings.viewPermission)
  const canEditCalendarNotes = checkPermission(settings.editPermission)

  if (!canViewCalendarNotes) return null
  if (!canEditCalendarNotes && (notes == null || notes === '')) return null

  const onOpen: React.MouseEventHandler<any> = e => {
    e.stopPropagation()
    setOpen(true)
  }

  const onConfirm = async () => {
    await editCalendarNotes(type, caseItem.caseId, text)
    setOpen(false)
  }

  const remainingChars = calendarNotesMaxLength - text.length
  const error = remainingChars < 0

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {notes != null && notes !== ''
          ? (
            <>
              <Typography variant='caption' sx={{ lineHeight: 'normal' }}>
                {trlb(`calendarCard_${type}_label`) + ': '}
                <strong>{notes}</strong>
              </Typography>
              {canEditCalendarNotes
                ? <IconButton size='small' sx={{ fontSize: 24, p: 0, mr: 0.5, alignSelf: 'flex-start' }} onClick={onOpen}>
                  <Edit sx={{ fontSize: 18 }} />
                </IconButton>
                : null}
            </>
          )
          : (
            <>
              <Typography variant='caption' sx={{ lineHeight: 'normal' }}>
                {trlb(`calendarCard_${type}_label`)}
              </Typography>
              <NoteAdd sx={{ fontSize: 16 }} onClick={onOpen} />
            </>
          )}
      </Box>
      <StandardDialog
        open={open}
        onClose={() => setOpen(false)}
        dialogStyle={{ zIndex: 200000 }}
        textKey={trlb('calendarCard_notes_title')}
        onConfirm={onConfirm}
        onClick={e => e.stopPropagation()}
        confirmDisabled={error}
      >
        <TextField
          sx={{ mt: 2, width: 400 }}
          autoFocus
          multiline
          fullWidth
          value={text}
          onChange={e => setText(e.target.value)}
          helperText={trlb(
            error ? 'calendarCard_notes_errorChars' : 'calendarCard_notes_remaining',
            { remainingChars: String(Math.abs(remainingChars)) }
          )}
          error={error}
        />
      </StandardDialog>
    </>
  )
}

export default CaseNotes
