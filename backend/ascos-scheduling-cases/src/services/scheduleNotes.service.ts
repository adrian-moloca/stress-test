import { LoggingService } from '@smambu/lib.commons-be'
import { Inject, Injectable } from '@nestjs/common'
import { Model } from 'mongoose'
import { ScheduleNotes, ScheduleNotesDocument } from 'src/schemas/scheduleNotes.schema'
import { auditTrailCreate, auditTrailUpdate, Component, EntityType, eScheduleNoteTimeSteps, getBoundaries, IUser, tCreateScheduleNoteDto, tEditScheduleNoteDto } from '@smambu/lib.constantsjs'
import { InjectModel } from '@nestjs/mongoose'
import { ClientProxy } from '@nestjs/microservices'

@Injectable()
export class ScheduleNotesService {
  constructor (
    @InjectModel(ScheduleNotes.name)
    private readonly scheduleNotesModel: Model<ScheduleNotesDocument>,
    private readonly loggingService: LoggingService,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
  ) {
    this.loggingService.setComponent(Component.SCHEDULING_CASES)
  }

  async getScheduleNotes (
    timeStep: eScheduleNoteTimeSteps,
    timestamp: number,
    page: number,
    limit: number
  ): Promise<ScheduleNotesDocument[]> {
    try {
      const {
        startDay,
        endDay,
        startWeek,
        endWeek,
        startMonth,
        endMonth,
        endSecondMonth,
        startFirstMonthWeek,
      } = getBoundaries(timestamp, process.env.VITE_TIME_ZONE)
      let dayMatch = { $gte: startDay, $lte: endDay }
      let weekMatch = { $gte: startWeek, $lte: endWeek }
      let monthMatch = { $gte: startMonth, $lte: endMonth }

      switch (timeStep) {
        case eScheduleNoteTimeSteps.WEEKS:
          // we need to cover when a week is split between months
          dayMatch = { $gte: startWeek, $lte: endWeek }
          monthMatch = { $gte: startMonth, $lte: endSecondMonth }
          break
        case eScheduleNoteTimeSteps.MONTHS:
          weekMatch = { $gte: startFirstMonthWeek, $lte: endMonth }
          dayMatch = { $gte: startMonth, $lte: endMonth }
          break
        default:
          break
      }

      const skip = page * limit

      const baseOptions = [
        { $skip: skip },
        { $limit: limit },
      ]

      const response = await this.scheduleNotesModel.aggregate([
        {
          $facet: {
            [eScheduleNoteTimeSteps.DAYS]: [
              {
                $match: {
                  timeStep: eScheduleNoteTimeSteps.DAYS,
                  timestamp: dayMatch
                }
              },
              ...baseOptions
            ],
            [eScheduleNoteTimeSteps.WEEKS]: [
              {
                $match: {
                  timeStep: eScheduleNoteTimeSteps.WEEKS,
                  timestamp: weekMatch
                }
              },
              ...baseOptions
            ],
            [eScheduleNoteTimeSteps.MONTHS]: [
              {
                $match: {
                  timeStep: eScheduleNoteTimeSteps.MONTHS,
                  timestamp: monthMatch
                }
              },
              ...baseOptions
            ],
            ...(page === 0
              ? {
                totalCount: [
                  {
                    $match: {
                      $or: [
                        { timeStep: eScheduleNoteTimeSteps.DAYS, timestamp: dayMatch },
                        { timeStep: eScheduleNoteTimeSteps.WEEKS, timestamp: weekMatch },
                        { timeStep: eScheduleNoteTimeSteps.MONTHS, timestamp: monthMatch }
                      ]
                    }
                  },
                  { $count: 'count' }
                ]
              }
              : {})
          }
        },
      ])

      return response[0]
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async editScheduleNote (
    { scheduleNoteId, text }: tEditScheduleNoteDto,
    user: IUser
  ): Promise<ScheduleNotesDocument> {
    try {
      const previousValue = await this.scheduleNotesModel.findById(scheduleNoteId)

      const response = await this.scheduleNotesModel
        .findByIdAndUpdate(scheduleNoteId, { text }, { new: true })

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.SCHEDULE_NOTE,
        prevObj: previousValue.toJSON(),
        newObj: response.toJSON(),
      })

      return response
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createScheduleNote (
    { timestamp, text, timeStep }: tCreateScheduleNoteDto, user: IUser
  ): Promise<ScheduleNotesDocument> {
    try {
      const response = await this.scheduleNotesModel.create({
        timestamp,
        text,
        timeStep,
        createdBy: user.id,
      })

      await auditTrailCreate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.SCHEDULE_NOTE,
        newObj: response.toJSON(),
      })

      return response
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
