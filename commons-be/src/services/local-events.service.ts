import { Injectable } from '@nestjs/common'
import { LoggingService } from './logging.service'
import { InjectModel } from '@nestjs/mongoose'
import { LocalEvents } from '../schemas'
import { Model } from 'mongoose'
import { Component, IGenericError } from '@smambu/lib.constantsjs'

@Injectable()
export class LocalEventsService {
  constructor (
    @InjectModel(LocalEvents.name)
    private readonly domainsModel: Model<LocalEvents>,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.NOT_YET_SET)
  }

  setComponent (componentName: Component) {
    this.loggingService.setComponent(componentName)
  }

  async getDownloadableEvents (limit?: number) {
    try {
      let downloadableEvents = this.domainsModel.find({
        downloaded: false
      })

      if (limit !== undefined && limit > 0)
        downloadableEvents = downloadableEvents.limit(limit)

      const results = await downloadableEvents.exec()

      return results
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e as IGenericError)
    }
  }

  async markAsDownloaded (id: string) {
    try {
      await this.domainsModel.updateOne({
        _id: id
      }, {
        $set: { downloaded: true }
      })

      return true
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e as IGenericError)
    }
  }

  // TODO: should we add a mechanism to delete events with some condition?
  // like older than x, or in an inconsistent state..
}
