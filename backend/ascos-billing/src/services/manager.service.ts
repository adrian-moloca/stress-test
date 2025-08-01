import { Inject, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { CronJob } from 'cron'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { NAMES, queueRetry } from 'src/utilities/constants'
import { GeneratedInvoiceService } from './generatedInvoice.service'
import { EnvConfigsService, LoggingService, RedisClientService } from '@smambu/lib.commons-be'
import { AsyncLocalStorage } from 'async_hooks'
import { TranslatorLanguages } from '@smambu/lib.constantsjs'

@Injectable()
export class ManagerService {
  @Inject(RedisClientService)
  private readonly redis: RedisClientService

  @Inject(GeneratedInvoiceService)
  private readonly generatedInvoicesClient: GeneratedInvoiceService

  async handleCron () {
    try {
      const translator = await this.envConfigClient.getTranslator(TranslatorLanguages.en)
      this.loggingService.logInfo(translator.fromLabel('manager_service_started_log'), false)
      const lockName = this.configService.get('BILLING_LOCK_NAME')
      await this.redis.redislock
        .using([lockName], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), {
          retryCount: 0,
          driftFactor: parseInt(process.env.REDISLOCK_DRIFT_FACTOR),
          retryDelay: parseInt(process.env.REDISLOCK_RETRY_DELAY),
          retryJitter: parseInt(process.env.REDISLOCK_RETRY_JITTER),
          automaticExtensionThreshold: parseInt(process.env
            .REDISLOCK_AUTOMATIC_EXTENSION_THRESHOLD),
        }, async () => {
          this.loggingService.logInfo(translator.fromLabel('manager_lock_gained'), false)

          const billToGenerate = await this.generatedInvoicesClient.getInvoicesToGenerate(true)

          const promises = billToGenerate.map(bill => {
            const jobId = bill.invoiceId

            this.loggingService.logInfo(`Job ${jobId} queued in the bill queue`, false)

            return this.billsQueue.add(bill,
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
    const translator = await this.envConfigClient.getTranslator(TranslatorLanguages.en)

    const cronPattern = this.configService.get('BILLING_MANAGER_CRONSTRING')

    if (!cronPattern) throw new Error(translator.fromLabel('missing_cronpattern'))

    const job = new CronJob(cronPattern, () => this.handleCron())

    this.schedulerRegistry.addCronJob(translator.fromLabel('manager_job_add'), job)
    job.start()

    this.loggingService.logWarn(translator.fromLabel('manager_job_started_log', { cronPattern }))
  }

  constructor (@InjectQueue(NAMES.BillsQueue) private billsQueue: Queue,
    private readonly configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly als: AsyncLocalStorage<{ bypassTenant: boolean }>,
    private readonly envConfigClient: EnvConfigsService,
    private readonly loggingService: LoggingService) {
    (global as any).als = this.als
    const store = { bypassTenant: true }
    this.als.run(store, () => this.init())
  }
}
