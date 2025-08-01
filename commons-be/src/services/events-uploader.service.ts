import { Inject, Injectable } from '@nestjs/common'
import { callMSWithTimeoutAndRetry, Component, EventPublisher, IGenericError, tLocalEventsMetadata, tLocalEventValue, tValidEventName } from '@smambu/lib.constantsjs'
import { ClientProxy } from '@nestjs/microservices'
import { LoggingService } from './logging.service'

@Injectable()
export class EventsUploaderService extends EventPublisher {
  constructor (
    @Inject('UR_CLIENT')
    private readonly urClient: ClientProxy,
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
    metadata: tLocalEventsMetadata,
    component: Component
  ) {
    try {
      const pattern = { role: 'localEvents', cmd: 'publish' }

      const payload = { source, sourceDocId, previousValues, currentValues, tenantId, metadata }

      const result = await callMSWithTimeoutAndRetry(this.urClient,
        pattern,
        payload,
        component)

      return result
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e as IGenericError)
    }
  }
}
