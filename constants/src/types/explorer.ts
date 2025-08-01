export type tExplorerData = {
  totalCases: number
  executedCases: number
  executedCasesByTimePeriod: {
    _id: string
    count: number
  }[]
  orsOccupancy: {
    _id: string
    count: number
  }[]
  dateGranularity: string
}

export type tExplorerDataDto = {
  startDate: string
  endDate: string
}

export type tExplorerState = {
  startDate: string
  endDate: string
}
