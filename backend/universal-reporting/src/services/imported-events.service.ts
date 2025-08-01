import { Injectable } from '@nestjs/common'
import { Component, EventPublisher, tLocalEventsMetadata, tLocalEventValue, tValidEventName } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ImportedEvents } from 'src/schemas/imported-events.schema'

@Injectable()
export class ImportedEventsService extends EventPublisher {
  constructor (
    @InjectModel(ImportedEvents.name)
    private readonly importedEventsModel: Model<ImportedEvents>,
    private loggingService: LoggingService,
  ) {
    super()
    this.loggingService.setComponent(Component.IMPORTED_EVENTS)
  }

  async publishEvent (
    source: tValidEventName,
    sourceDocId: string,
    previousValues: tLocalEventValue,
    currentValues: tLocalEventValue,
    tenantId: string,
    metadata: tLocalEventsMetadata
  ) {
    try {
      await this.importedEventsModel.create({
        source,
        sourceDocId,
        previousValues,
        currentValues,
        tenantId,
        metadata
      })

      return true
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }
}
