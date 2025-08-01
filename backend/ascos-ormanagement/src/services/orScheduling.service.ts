import { LoggingService } from '@smambu/lib.commons-be'
import { Component, editOrSchedulingDto } from '@smambu/lib.constantsjs'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { OrSchedulingClass, OrSchedulingDocument } from 'src/schemas/orScheduling.schema'
@Injectable()
export class OrSchedulingService {
  private models: Array<{ model: Model<any>; label: string }>
  constructor (
    @InjectModel(OrSchedulingClass.name)
    private readonly orScheduling: Model<OrSchedulingDocument>,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.OR_MANAGEMENT)
  }

  async findByDate (timeStamp: number) {
    try {
      const res = await this.orScheduling.find({ timeStamp })
      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async editOrScheduling (data: editOrSchedulingDto) {
    try {
      const response = []

      for (const { _id, ...orSchedule } of data)
        if (!_id.includes('temp_')) {
          const res = await this.orScheduling.findByIdAndUpdate(_id, orSchedule, { new: true })
          response.push(res)
        } else {
          const oldOrSchedule = await this.orScheduling.findOne({
            timeStamp: orSchedule.timeStamp,
            operatingRoomId: orSchedule.operatingRoomId
          })

          if (oldOrSchedule != null)
            throw new Error('OrSchedule found with same coordinates') // should never happen

          const payload = {
            timeStamp: orSchedule.timeStamp,
            anestIds: orSchedule.anestIds,
            operatingRoomId: orSchedule.operatingRoomId,
          }

          const res = await this.orScheduling.create(payload)
          response.push(res)
        }

      return response
    } catch (e) {
      console.error(e)
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
