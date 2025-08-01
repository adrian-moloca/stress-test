import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Case, CaseDocument } from '../schemas/cases.schema'
import { Model } from 'mongoose'
import { executedStatuses, Component, tExplorerData } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'
import { differenceInDays, isValid } from 'date-fns'

@Injectable()
export class ExplorerService {
  constructor (
    @InjectModel(Case.name) private readonly caseModel: Model<CaseDocument>,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.SCHEDULING_CASES)
  }

  async getData ({ startDate, endDate }: {startDate: Date, endDate: Date}): Promise<tExplorerData> {
    try {
      if (!isValid(startDate) || !isValid(endDate))
        throw new Error('Invalid date') // This should never happen

      const periodLength = differenceInDays(endDate, startDate)
      let dateGranularity = 'days'
      let dateString = '%Y-%m-%d'
      if (periodLength > Number(process.env.EXPLORER_DAYS_BREAKPOINT)) {
        dateGranularity = 'weeks'
        dateString = '%Y-%U'
      }
      if (periodLength > Number(process.env.EXPLORER_WEEKS_BREAKPOINT)) {
        dateGranularity = 'months'
        dateString = '%Y-%m'
      }

      const casesData = await this.caseModel.aggregate([
        {
          $match: {
            'bookingSection.date': {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $facet: {
            overallCounts: [
              {
                $project: {
                  executedCases: {
                    $cond: [{ $in: ['$status', executedStatuses] }, 1, 0]
                  },
                  totalCases: 1,
                }
              },
              {
                $group: {
                  _id: null,
                  executedCases: { $sum: '$executedCases' },
                  totalCases: { $sum: 1 },
                }
              }
            ],
            executedCasesByTimePeriod: [
              {
                $match: {
                  status: { $in: executedStatuses }
                }
              },
              {
                $group: {
                  _id: { $dateToString: { format: dateString, date: '$bookingSection.date' } },
                  count: { $sum: 1 }
                }
              }
            ],
            orsOccupancy: [
              // Filter the cases with room enter and exit timestamps and the available ORs
              {
                $match: {
                  'timestamps.roomEnterTimestamp': { $ne: null },
                  'timestamps.roomExitTimestmap': { $ne: null },
                },
              },
              // Project the operating room id, the formatted date and the usage time in seconds
              {
                $project: {
                  formattedDate: {
                    $dateToString: {
                      format: dateString,
                      date: { $toDate: '$timestamps.roomEnterTimestamp' }
                    }
                  },
                  usageTime: {
                    $divide: [
                      { $subtract: [{ $toDate: '$timestamps.roomExitTimestmap' }, { $toDate: '$timestamps.roomEnterTimestamp' }] },
                      1000 // Convert milliseconds to seconds
                    ]
                  }
                }
              },
              // average the usage time for each date
              {
                $group: {
                  _id: '$formattedDate',
                  count: { $avg: '$usageTime' }
                }
              }
            ],
          }
        }
      ])

      const overallCounts = casesData[0].overallCounts[0]

      return {
        totalCases: overallCounts?.totalCases ?? 0,
        executedCases: overallCounts?.executedCases ?? 0,
        executedCasesByTimePeriod: casesData[0].executedCasesByTimePeriod,
        orsOccupancy: casesData[0].orsOccupancy,
        dateGranularity,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
