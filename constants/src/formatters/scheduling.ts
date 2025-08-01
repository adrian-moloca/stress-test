import { tScheduleNote } from '../types'

export const formatScheduleNoteFromBackend = (scheduleNote: tScheduleNote) => ({
  ...scheduleNote,
  createdAt: new Date(scheduleNote.createdAt),
  updatedAt: new Date(scheduleNote.updatedAt),
})

export const formatScheduleNotesFromBackend = (scheduleNotes: tScheduleNote[]) =>
  scheduleNotes.map(formatScheduleNoteFromBackend)
