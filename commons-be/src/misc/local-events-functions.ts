import { Job } from 'bullmq'
import { Queue } from 'bull'
import { CronJob } from 'cron'
import { SchedulerRegistry } from '@nestjs/schedule'
import { Component, EventPublisher, IGenericError, queueRetry, tLocalQueueEvent, tSourceSchemaValues } from '@smambu/lib.constantsjs'
import { getParsedEventType } from '../utilities'
import { LocalEventsService, LoggingService, RedisClientService } from '../services'

export const processLocalQueueEvent = async (job: Job<tLocalQueueEvent, boolean, string>,
  eventPublisherService: EventPublisher,
  localEventsService: LocalEventsService,
  loggingService: LoggingService,
  component: Component) => {
  try {
    const { id: jobId, data } = job
    loggingService.logInfo(`Processing job ${jobId}`, false)

    const {
      source,
      sourceDocId,
      previousValues,
      currentValues,
      tenantId,
      id,
      metadata
    } = data

    const als = global.als
    const store = { tenantId }
    als.enterWith(store)

    const eventType = getParsedEventType(source as tSourceSchemaValues,
      previousValues,
      currentValues)

    if (eventType === null) {
      const errorMessage = `
      Error: event with ${id} has a wrong format and cannot be parsed. 
      Please check it manually.`

      throw Error(errorMessage)
    }

    await eventPublisherService.publishEvent(eventType,
      `${sourceDocId}`,
      previousValues,
      currentValues,
      tenantId,
      metadata,
      component)

    await localEventsService.markAsDownloaded(id)

    return true
  } catch (e) {
    await loggingService.throwErrorAndLog(e as IGenericError)
  }
}

export const onLocalEventJobCompleted = (job: Job, loggingService: LoggingService) => {
  const message = `Job ${job.id} successfully completed`

  loggingService.logInfo(message, false)
}

export const onLocalEventJobFailed = (job: Job,
  failedReason: string,
  loggingService: LoggingService) => {
  const failMessage = `Job ${job.id} failed with reason ${failedReason}`

  loggingService.logError(failMessage)
}

export const initLocalEventsCronService = (
  cronPattern: string,
  lockDuration:number,
  driftFactor:number,
  retryDelay:number,
  retryJitter:number,
  automaticExtensionThreshold:number,
  lockName:string,
  loggingService: LoggingService,
  localEventsServiceClient: LocalEventsService,
  schedulerRegistry: SchedulerRegistry,
  redis: RedisClientService,
  eventsQueue: Queue
) => {
  const job = new CronJob(cronPattern, () => handleLocalEventsCron(
    lockDuration,
    driftFactor,
    retryDelay,
    retryJitter,
    automaticExtensionThreshold,
    lockName,
    loggingService,
    localEventsServiceClient,
    redis,
    eventsQueue
  ))

  schedulerRegistry.addCronJob('Events sender added', job)
  job.start()

  loggingService.logWarn(`Events sender Job added with pattern ${cronPattern}`)
}

export const handleLocalEventsCron = async (
  lockDuration:number,
  driftFactor:number,
  retryDelay:number,
  retryJitter:number,
  automaticExtensionThreshold:number,
  lockName:string,
  loggingService: LoggingService,
  localEventsServiceClient: LocalEventsService,
  redis: RedisClientService,
  eventsQueue: Queue
) => {
  try {
    loggingService.logInfo('[Events sender] service started', false)

    await redis.redislock
      .using([lockName], lockDuration, {
        retryCount: 0,
        driftFactor,
        retryDelay,
        retryJitter,
        automaticExtensionThreshold,
      }, async () => {
        loggingService.logInfo('[Events sender] lock gained', false)

        const downloadableEvents = await localEventsServiceClient.getDownloadableEvents()

        loggingService.logInfo(`Found ${downloadableEvents.length} events to download`)
        if (downloadableEvents === undefined || downloadableEvents.length === 0) {
          loggingService.logInfo('No events to download', false)
          return
        }

        const promises = downloadableEvents.map(event => {
          const jobId = event.id

          loggingService.logInfo(`Job ${jobId} queued in the local events queue`, false)

          return eventsQueue.add('event',
            event,
            {
              jobId,
              removeOnComplete: true,
              removeOnFail: true,
              ...queueRetry()
            })
        })

        await Promise.all(promises)
      })
  } catch (e) {
    loggingService.logInfo(e as string, false)
  }
}
