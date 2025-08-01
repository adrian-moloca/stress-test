/* eslint-disable*/
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { INormalizerJob, NAMES, NORMALIZE_OPERATIONS, queueRetry } from 'src/utilities/constants'
import { Component, callMSWithTimeoutAndRetry, tAsyncLocalStorage, TranslatorLanguages } from '@smambu/lib.constantsjs'
import { BillingService } from './billing.service'
import { ClientProxy } from '@nestjs/microservices'
import { GeneratedInvoiceService } from './generatedInvoice.service'
import { AsyncLocalStorage } from 'async_hooks'
import { EnvConfigsService, LoggingService, RedisClientService } from '@smambu/lib.commons-be'

@Injectable()
export class NormalizerService {
    @Inject(BillingService)
  private readonly billingClient: BillingService

    @Inject(GeneratedInvoiceService)
    private readonly generatedInvoiceService: GeneratedInvoiceService

    @Inject('CONTRACT_CLIENT')
    private readonly contractClient: ClientProxy

    @Inject('USERS_CLIENT')
    private readonly usersClient: ClientProxy

    async processCases () {
      const casesWithoutAnesthesiologistPresence = await this.billingClient
        .getCasesWithotAnesthesiologistPresence()
      const casesWithoutDoctor = await this.billingClient
        .getCasesWithoutDoctor()
      const casesWithoutContractSnapshot = await this.billingClient
        .getCasesWithoutContractSnapshot()
      const CaseswithBookingDateOfTypeString = await this.billingClient
        .getCaseswithBookingDateOfTypeString()
      const casesWithoutOpstandatdsArray = await this.billingClient
        .getCasesWithoutOpstandardsArray()
      const casesWithMoreThanOneOp = await this.billingClient.getCasesWithMoreThanOneOp()
      const casesWithoutNeededInvoiceTypes = await this.billingClient
        .getCasesWithoutNeededInvoiceTypes()
      const casesWithoutMissingInfo = await this.billingClient.getCasesWithoutMissingInfo()
      const casesWithoutBillingCategory = await this.billingClient.getCasesWithoutBillingCategory()
      const numberOfCasesToNormalize =
            (casesWithoutDoctor?.length ?? 0) +
            (CaseswithBookingDateOfTypeString?.length ?? 0) +
            (casesWithoutContractSnapshot?.length ?? 0) +
            (casesWithoutOpstandatdsArray?.length ?? 0) +
            (casesWithMoreThanOneOp?.length ?? 0) +
            (casesWithoutNeededInvoiceTypes?.length ?? 0) +
            (casesWithoutMissingInfo?.length ?? 0) +
            (casesWithoutBillingCategory?.length ?? 0) +
            (casesWithoutAnesthesiologistPresence?.length ?? 0)

      this.loggingService.logInfo(`Found ${numberOfCasesToNormalize} cases to normalize`)
      try {
        for (const caseItem of casesWithoutAnesthesiologistPresence) {
          const jobId = `casesWithoutAnesthesiologistPresence-${caseItem._id}`
          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`, false)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITHOUT_ANESTHESIOLOGIST_PRESENCE }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of casesWithoutBillingCategory) {
          const jobId = `casesWithoutBillingCategory-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITHOUT_BILLING_CATEGORY }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of casesWithoutDoctor) {
          const jobId = `casesWithoutDoctor-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITHOUT_DOCTOR }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of casesWithMoreThanOneOp) {
          const jobId = `casesWithMoreThanOneOp-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITH_MORE_THAN_ONE_OP }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of casesWithoutContractSnapshot) {
          const jobId = `casesWithoutContractSnapshot-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITHOUT_CONTRACT_SNAPSHOT }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of CaseswithBookingDateOfTypeString) {
          const jobId = `CaseswithBookingDateOfTypeString-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITH_BOOKING_DATE_OF_TYPE_STRING }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of casesWithoutOpstandatdsArray) {
          const jobId = `casesWithoutOpstandatdsArray-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITHOUT_OPSTANDARDS_ARRAY }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of casesWithoutNeededInvoiceTypes) {
          const jobId = `casesWithoutNeededInvoiceTypes-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITHOUT_NEEDED_INVOICE_TYPES }

          await this.normalizerQueue.add(jobContent, { jobId, removeOnComplete: true, removeOnFail: true, ...queueRetry() })
        }

        for (const caseItem of casesWithoutMissingInfo) {
          const jobId = `casesWithoutMissingInfo-${caseItem._id}`

          this.loggingService.logInfo(`Job ${jobId} queued in the normalizer queue`)
          const jobContent: INormalizerJob = { payload: caseItem, type: NORMALIZE_OPERATIONS.CASES_WITHOUT_MISSING_INFO }

          await this.normalizerQueue.add(jobContent, { 
            jobId, 
            removeOnComplete: true, 
            removeOnFail: true, 
            ...queueRetry() })
        }
      } catch (e) {
        throw e
      }
    }

    async normalizeBills () {
      await this.generatedInvoiceService.addInvoiceNumber()
    }

    async priorityAndAllBlocking () {
      this.loggingService.logInfo('Starting priority and blocking operations', false)

      const lockName = this.configService.get('BILLING_LOCK_NAME')

      await this.redis.redislock.using([lockName], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), {
        retryCount: 0,
        driftFactor: parseInt(process.env.REDISLOCK_DRIFT_FACTOR),
        retryDelay: parseInt(process.env.REDISLOCK_RETRY_DELAY),
        retryJitter: parseInt(process.env.REDISLOCK_RETRY_JITTER),
        automaticExtensionThreshold: parseInt(process.env.REDISLOCK_AUTOMATIC_EXTENSION_THRESHOLD),
      }, async signal => {
        await this.normalizeBills()
      })

      this.loggingService.logInfo('Priority and blocking operations ended', false)
    }

    async doOperations () {
      const als = global.als
      const store = { bypassTenant: true }
      als.enterWith(store)

      const translator = await this.envConfigClient.getTranslator(TranslatorLanguages.en)

      await this.priorityAndAllBlocking()

      const lockName = this.configService.get('NORMALIZER_LOCK_NAME')

      await this.redis.redislock.using([lockName], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), {
        retryCount: 0,
        driftFactor: parseInt(process.env.REDISLOCK_DRIFT_FACTOR),
        retryDelay: parseInt(process.env.REDISLOCK_RETRY_DELAY),
        retryJitter: parseInt(process.env.REDISLOCK_RETRY_JITTER),
        automaticExtensionThreshold: parseInt(process.env.REDISLOCK_AUTOMATIC_EXTENSION_THRESHOLD),
      }, async signal => {
        this.loggingService.logInfo(translator.fromLabel('normalizer_service_started_log'), false)
        this.loggingService.logInfo(translator.fromLabel('normalizer_lock_gained'), false)

        await this.processCases()
      })

      this.loggingService.logWarn(translator.fromLabel('normalizer_job_started_log'))
    }

    constructor (
        @InjectQueue(NAMES.NormalizerQueue) private normalizerQueue: Queue,
        private readonly configService: ConfigService,
        private readonly redis: RedisClientService,
        private readonly als: AsyncLocalStorage<tAsyncLocalStorage>,
        private readonly envConfigClient: EnvConfigsService,
        private readonly loggingService: LoggingService,
    ) {
      this.loggingService.setComponent(Component.BILLING)
      global.als = this.als
      const store = { bypassTenant: true }
      // this.als.run(store, () => this.doOperations())
    }
}
