import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Inject } from '@nestjs/common'
import { EventsUploaderService, LocalEventsService, LoggingService, onLocalEventJobCompleted, onLocalEventJobFailed, processLocalQueueEvent } from '@smambu/lib.commons-be'
import { Component, IGenericError, QUEUE_NAMES, tLocalQueueEvent } from '@smambu/lib.constantsjs'
import { Job } from 'bullmq'

@Processor(QUEUE_NAMES.LocalEventsSchedulingCasesQueue)
export class LocalEventsConsumer extends WorkerHost {
  constructor (
    private readonly eventPublisherService: EventsUploaderService,
    @Inject(LocalEventsService)
    private readonly localEventsService: LocalEventsService,
    private readonly loggingService: LoggingService,
  ) {
    super()
    this.loggingService.setComponent(Component.LOCAL_EVENTS_CONSUMER_SCHEDULING_CASES)
  }

  async process (job: Job<tLocalQueueEvent, boolean, string>) {
    try {
      await processLocalQueueEvent(job,
        this.eventPublisherService,
        this.localEventsService,
        this.loggingService,
        Component.SCHEDULING_CASES)
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
