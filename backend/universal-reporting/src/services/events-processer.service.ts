import { Inject, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { CronJob } from 'cron'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { LoggingService, RedisClientService } from '@smambu/lib.commons-be'
import { AsyncLocalStorage } from 'async_hooks'
import { QUEUE_NAMES, queueRetry, parseRedisLockVars } from '@smambu/lib.constantsjs'
import { URService } from './ur.service'
import { FieldsOperationsService } from './field-operations.service'

@Injectable()
export class EventsProcesserService {
  @Inject(RedisClientService)
  private readonly redis: RedisClientService

  @Inject(URService)
  private readonly urServiceClient: URService

  @Inject(FieldsOperationsService)
  private readonly fieldsOperations: FieldsOperationsService

  async handleCron () {
    try {
      const env = process.env

      const {
        lockDuration,
        driftFactor,
        retryDelay,
        retryJitter,
        automaticExtensionThreshold
      } = parseRedisLockVars(env)

      this.loggingService.logInfo('[Events processer] service started', false)
      const lockName = this.configService.get('UR_EVENTS_PROCESSER_LOCK_NAME')

      // XXX We check that there is not a config being processed - if that is the case,
      // all operations that might create or edit proxies are halted until the config
      // has been processed successfully.
      const systemIsBusy = await this.fieldsOperations.areThereOperationsRunning()

      if (systemIsBusy) {
        this.loggingService.logInfo('There is a config being processed, service will halt.', false)
        return
      }

      await this.redis.redislock
        .using([lockName], lockDuration, {
          retryCount: 0,
          driftFactor,
          retryDelay,
          retryJitter,
          automaticExtensionThreshold,
        }, async () => {
          this.loggingService.logInfo('[Events processer] lock gained', false)

          const unprocessedEvents = await this.urServiceClient.getUnprocessedImportedEvents(true)

          if (unprocessedEvents === undefined || unprocessedEvents.length === 0)
            this.loggingService.logInfo('No events to process', false)

          const promises = unprocessedEvents.map(event => {
            const jobId = event.id

            this.loggingService.logInfo(`Job ${jobId} queued in the ur triggers queue`, false)

            return this.eventsQueue.add('event',
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
      this.loggingService.logInfo(e, false)
    }
  }

  async init () {
    const cronPattern = this.configService.get('UR_EVENTS_PROCESSER_CRONSTRING')

    if (!cronPattern) throw new Error('Error: cronPattern MUST exists for events processer service')

    const job = new CronJob(cronPattern, () => this.handleCron())

    this.schedulerRegistry.addCronJob('Events processer added', job)
    job.start()

    this.loggingService.logWarn(`Events processer Job added with pattern ${cronPattern}`)
  }

  constructor (@InjectQueue(QUEUE_NAMES.URTriggerEvents) private eventsQueue: Queue,
    private readonly configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly als: AsyncLocalStorage<{ bypassTenant: boolean }>,
    private readonly loggingService: LoggingService) {
    global.als = this.als
    const store = { bypassTenant: true }
    this.als.run(store, () => this.init())
  }
}
