import React from 'react'
import { Box, IconButton, TextField } from '@mui/material'
import RequestsAccordion from './RequestsAccordion'
import { trlb } from 'utilities'
import { eScheduleNoteTimeSteps, getTimeStepTimestamp } from '@smambu/lib.constants'
import { tScheduleNoteStateSection, useGetScheduleNotes } from 'hooks/scheduleNotesHooks'
import { Add } from '@mui/icons-material'
import StandardDialog from 'components/StandardDialog'
import { useAppSelector } from 'store'
import ScheduleNoteBullet from './ScheduleNoteBullet'

const timeZone = import.meta.env.VITE_TIME_ZONE

interface ScheduleNotesProps {
  date: Date
  timeStep: eScheduleNoteTimeSteps
}

const ScheduleNotes = ({ date, timeStep }: ScheduleNotesProps) => {
  const [open, setOpen] = React.useState(false)
  const [clickedOpened, setClickedOpened] = React.useState(false)
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const [openCreateModal, setOpenCreateModal] = React.useState(false)
  const [text, setText] = React.useState('')
  const isoDate = date.toISOString()
  const timestamp = getTimeStepTimestamp(date, timeStep, timeZone)
  const { scheduleNotes, canEditScheduleNotes, createScheduleNote, editScheduleNote } =
    useGetScheduleNotes({ timestamp, timeStep })

  React.useEffect(() => {
    setClickedOpened(false)
  }, [isoDate, timeStep])

  const onCreateClick = (event: React.MouseEvent) => {
    setText('')
    event.stopPropagation()
    setOpenCreateModal(true)
  }

  const onCreateSave = async () => {
    await createScheduleNote({ text, timeStep, timestamp })
    setOpenCreateModal(false)
    setText('')
  }

  const listAndSortNotes = (notes: tScheduleNoteStateSection) => Object.values(notes)
    .sort((a, b) => a.timestamp - b.timestamp)

  const scheduleNotesSorted = [
    ...listAndSortNotes(scheduleNotes[eScheduleNoteTimeSteps.DAYS]),
    ...listAndSortNotes(scheduleNotes[eScheduleNoteTimeSteps.WEEKS]),
    ...listAndSortNotes(scheduleNotes[eScheduleNoteTimeSteps.MONTHS]),
  ]
  const count = scheduleNotesSorted.length

  const isOpen = clickedOpened ? open : scheduleNotesSorted.length > 0

  const onOpen = () => {
    setClickedOpened(true)
    setOpen(!open)
  }

  return (
    <>
      <RequestsAccordion
        title={trlb('orScheduling_scheduleNotes', { count: count ? ` (${count})` : '' })}
        titleButton={canEditScheduleNotes && (
          <IconButton size='small' onClick={onCreateClick}>
            <Add />
          </IconButton>
        )}
        open={isOpen}
        setOpen={onOpen}
        details={
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', gap: 1 }}>
            {scheduleNotesSorted.map(scheduleNote => (
              <ScheduleNoteBullet
                key={scheduleNote._id}
                scheduleNote={scheduleNote}
                canEditScheduleNotes={canEditScheduleNotes}
                editScheduleNote={editScheduleNote}
                isLoading={isLoading}
                timeZone={timeZone}
              />
            ))}
          </Box>
        }
        isLast
      />
      <StandardDialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onConfirm={onCreateSave}
        textKey={'scheduleNotes_create_title'}
        confirmDisabled={isLoading || !text}
      >
        <TextField
          multiline
          sx={{ width: '100%', minWidth: 500 }}
          variant='outlined'
          rows={10}
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          placeholder={trlb('scheduleNotes_text')}
        />
      </StandardDialog>
    </>
  )
}

export default ScheduleNotes
