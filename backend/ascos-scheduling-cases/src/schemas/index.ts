import { Case, CaseSchema } from './cases.schema'
import { CaseBackupSchema } from './casesBackup.schema'
import { LockedWeekSchema } from './lockedWeeks.schema'
import { CaseLastUpdates, caseLastUpdatesSchema } from './caseLastUpdates'
import { ScheduleNotes, ScheduleNotesSchema } from './scheduleNotes.schema'
import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'
export default [
  {
    name: Case.name,
    schema: CaseSchema,
  },
  {
    name: 'LockedWeek',
    schema: LockedWeekSchema,
  },
  {
    name: 'CaseBackup',
    schema: CaseBackupSchema,
  },
  {
    name: CaseLastUpdates.name,
    schema: caseLastUpdatesSchema,
  },
  {
    name: ScheduleNotes.name,
    schema: ScheduleNotesSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
]
