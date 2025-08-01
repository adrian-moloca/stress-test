export enum eScheduleNoteTimeSteps {
  'DAYS' = 'days',
  'WEEKS' = 'weeks',
  'MONTHS' = 'months',
}

export type tScheduleNote = {
  timeStep: eScheduleNoteTimeSteps
  text: string
  timestamp: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  _id: string
}

export type tCreateScheduleNoteDto = {
  timestamp: number
  text: string
  timeStep: eScheduleNoteTimeSteps
}

export type tEditScheduleNoteDto = {
  scheduleNoteId: string
  text: string
}

export type tGetScheduleNotesDto = {
  timeStep: eScheduleNoteTimeSteps
  timestamp: number
  page: number
  limit: number
}
