import { endOfDay, endOfMonth, startOfDay, startOfMonth, subMonths } from 'date-fns'

export const explorerTimePeriods: Record<
  string,
  {
    index: number;
    value: string;
    startDate: string;
    endDate: string;
  }
> = {
  thisMonth: {
    index: 0,
    value: 'thisMonth',
    startDate: startOfDay(startOfMonth(new Date())).toISOString(),
    endDate: endOfDay(endOfMonth(new Date())).toISOString(),
  },
  lastMonth: {
    index: 1,
    value: 'lastMonth',
    startDate: startOfDay(startOfMonth(subMonths(new Date(), 1))).toISOString(),
    endDate: endOfDay(endOfMonth(subMonths(new Date(), 1))).toISOString(),
  },
}

export const explorerTimePeriodOptions = Object.values(explorerTimePeriods)
  .sort((a, b) => a.index - b.index)
  .map(({ value }) => ({
    label: `explorer_${value}_timePeriod`,
    value,
  }))
