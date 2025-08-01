import { Inject, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { CronJob } from 'cron'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { LoggingService, RedisClientService } from '@smambu/lib.commons-be'
import { AsyncLocalStorage } from 'async_hooks'
import { QUEUE_NAMES, queueRetry, tGraphFieldJob, parseRedisLockVars } from '@smambu/lib.constantsjs'
import { FieldsOperationsService } from './field-operations.service'

@Injectable()
export class FieldOperationsAnalyzerService {
  @Inject(RedisClientService)
  private readonly redis: RedisClientService

  @Inject(FieldsOperationsService)
  private readonly fieldsOperationsService: FieldsOperationsService

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

      this.loggingService.logInfo('[Fields operations analyzer] service started', false)
      const lockName = this.configService.get('UR_FIELD_OPERATIONS_ANALYZER_LOCK_NAME')
      await this.redis.redislock
        .using([lockName], lockDuration, {
          retryCount: 0,
          driftFactor,
          retryDelay,
          retryJitter,
          automaticExtensionThreshold,
        }, async () => {
          this.loggingService.logInfo('[Fields operations analyzer] lock gained', false)

          const operationsToProcess = await this.fieldsOperationsService
            .getFieldsOperationsToProcess()

          const promises = operationsToProcess.map(current => {
            const { type, field, domainId, tenantId, id } = current
            const jobId = `${field.id}-${type}`

            const fieldJob: tGraphFieldJob = {
              id,
              type,
              field,
              domainId,
              tenantId
            }

            this.loggingService.logInfo(`Job ${jobId} queued in the graph fields queue`, false)

            const jobOptions = {
              jobId,
              removeOnComplete: true,
              removeOnFail: true,
              ...queueRetry()
            }

            return this.graphFieldsQueue.add('field',
              fieldJob,
              jobOptions)
          })
          await Promise.all(promises)
        })
    } catch (e) {
      this.loggingService.logInfo(e, false)
    }
  }

  async init () {
    const cronPattern = this.configService.get('UR_FIELD_OPERATIONS_ANALYZER_CRONSTRING')

    if (!cronPattern) throw new Error('Error: cronPattern MUST exists for field operations analyzer service')

    const job = new CronJob(cronPattern, () => this.handleCron())

    this.schedulerRegistry.addCronJob('Field operations analyzer added', job)
    job.start()

    this.loggingService.logWarn(`Field operations analyzer Job added with pattern ${cronPattern}`)
  }

  constructor (@InjectQueue(QUEUE_NAMES.GraphFieldsQueue) private graphFieldsQueue: Queue,
    private readonly configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly als: AsyncLocalStorage<{ bypassTenant: boolean }>,
    private readonly loggingService: LoggingService) {
    global.als = this.als
    const store = { bypassTenant: true }
    this.als.run(store, () => this.init())
  }
}
