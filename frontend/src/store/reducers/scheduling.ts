import { ICaseBackup, getLockedWeekTimestamp } from '@smambu/lib.constants'
import { SCHEDULING_ACTION } from 'store/actions'

interface ISchedulingState {
  lockedWeeks: Record<number, number>
  caseBackup: Record<string, Record<string, ICaseBackup>>
}

const initialState = {
  lockedWeeks: {},
  caseBackup: {},
} as ISchedulingState

const timeZone = import.meta.env.VITE_TIME_ZONE

export default function reducer (state = initialState,
  action: { type: string; payload: any }): ISchedulingState {
  switch (action.type) {
    case SCHEDULING_ACTION.SET_LOCKED_WEEK:
      return {
        ...state,
        lockedWeeks: {
          ...state.lockedWeeks,
          [action.payload.lockedWeekTimestamp]: action.payload.saveDateTime,
        },
      }
    case SCHEDULING_ACTION.SET_CASE_BACKUP:
      const lockedWeekTimestamp = getLockedWeekTimestamp(action.payload.date, timeZone)
      return {
        ...state,
        caseBackup: {
          ...(state.caseBackup ?? {}),
          [lockedWeekTimestamp]: {
            ...(state?.caseBackup?.[lockedWeekTimestamp] ?? {}),
            [action.payload.caseId]: action.payload,
          },
        },
      }
    case SCHEDULING_ACTION.SET_CASES_BACKUP:
      const newCaseBackup = action.payload?.cases?.reduce((acc: Record<string, ICaseBackup>,
        curr: ICaseBackup) => {
        return {
          ...acc,
          [curr.caseId]: curr,
        }
      }, {} as Record<string, ICaseBackup>)
      return {
        ...state,
        caseBackup: {
          ...(state.caseBackup ?? {}),
          [action.payload.lockedWeekTimestamp]: {
            ...(state?.caseBackup?.[action.payload.lockedWeekTimestamp] ?? {}),
            ...newCaseBackup,
          },
        },
      }
    case SCHEDULING_ACTION.RESET_BACKUPS:
      return {
        ...state,
        caseBackup: {
          ...state.caseBackup,
          [action.payload.lockedWeekTimestamp]: {},
        },
      }
    default:
      return state
  }
}
