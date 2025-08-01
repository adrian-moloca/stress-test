import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Inject } from '@nestjs/common'
import { LocalEventsService, LoggingService, onLocalEventJobCompleted, onLocalEventJobFailed, processLocalQueueEvent } from '@smambu/lib.commons-be'
import { Component, IGenericError, QUEUE_NAMES, tLocalQueueEvent } from '@smambu/lib.constantsjs'
import { Job } from 'bullmq'
import { ImportedEventsService } from 'src/services'

@Processor(QUEUE_NAMES.LocalEventsURQueue)
export class LocalEventsConsumer extends WorkerHost {
  constructor (
    @Inject(ImportedEventsService)
    private readonly eventPublisherService: ImportedEventsService,
    @Inject(LocalEventsService)
    private readonly localEventsService: LocalEventsService,
    private readonly loggingService: LoggingService,
  ) {
    super()
    this.loggingService.setComponent(Component.LOCAL_EVENTS_CONSUMER_UR)
  }

  async process (job: Job<tLocalQueueEvent, boolean, string>) {
    try {
      await processLocalQueueEvent(job,
        this.eventPublisherService,
        this.localEventsService,
        this.loggingService,
        Component.UNIVERSAL_REPORTING)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e as IGenericError)
    }
  }

  @OnWorkerEvent('completed')
  onCompleted (job: Job) {
    onLocalEventJobCompleted(job, this.loggingService)
  }

  @OnWorkerEvent('failed')
  onFailed (job: Job, failedReason: string) {
    onLocalEventJobFailed(job, failedReason, this.loggingService)
  }
}
