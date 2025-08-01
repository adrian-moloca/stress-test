import { Case, Component, IUser, callMSWithTimeoutAndRetry } from '@smambu/lib.constantsjs'
import { Processor, Process } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'
import { INormalizerJob, NAMES, NORMALIZE_OPERATIONS } from 'src/utilities/constants'
import { BillingService } from './billing.service'
import { ClientProxy } from '@nestjs/microservices'
import { GeneratedInvoiceService } from './generatedInvoice.service'
import { LoggingService } from '@smambu/lib.commons-be'

@Processor(NAMES.NormalizerQueue)
export class NormalizerConsumer {
  @Inject(BillingService)
  private readonly billingClient: BillingService

  @Inject(GeneratedInvoiceService)
  private readonly generatedInvoiceServiceClient: GeneratedInvoiceService

  @Inject('CONTRACT_CLIENT')
  private readonly contractClient: ClientProxy

  @Inject('USERS_CLIENT')
  private readonly usersClient: ClientProxy

  constructor (
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BILLING)
  }

  @Process()
  async normalize (job: Job<INormalizerJob>) {
    try {
      const { type, payload } = job.data

      const logMessage = `Processing ${job.id} ${type}`
      this.loggingService.logInfo(logMessage)

      switch (type) {
        case NORMALIZE_OPERATIONS.CASES_WITHOUT_ANESTHESIOLOGIST_PRESENCE:
          await this.billingClient
            .normalizeCaseWithoutAnesthesiologistPresence((payload as Case)._id)
          break

        case NORMALIZE_OPERATIONS.USERS_WITH_PASSWORD:
          const pattern = { role: 'user', cmd: 'normalizeUserWithPassword' }

          const payloadData = { userId: (payload as IUser)?.id }

          await callMSWithTimeoutAndRetry(this.usersClient,
            pattern,
            payloadData,
            Component.BILLING)
          break

        case NORMALIZE_OPERATIONS.CASES_WITHOUT_DOCTOR:
          await this.billingClient.normalizeCaseWithoutDoctor((payload as Case)?.caseId)
          break

        case NORMALIZE_OPERATIONS.CASES_WITHOUT_CONTRACT_SNAPSHOT:
          await this.billingClient.normalizeCaseWithoutContractSnapshot((payload as Case)?.caseId)
          break

        case NORMALIZE_OPERATIONS.CASES_WITH_BOOKING_DATE_OF_TYPE_STRING:
          await this.billingClient
            .normalizeCasewithBookingDateOfTypeString((payload as Case)?.caseId)
          break

        case NORMALIZE_OPERATIONS.CASES_WITHOUT_OPSTANDARDS_ARRAY:
          await this.billingClient.normalizeCaseWithoutOpstandardsArray((payload as Case)?.caseId)
          break

        case NORMALIZE_OPERATIONS.CASES_WITH_MORE_THAN_ONE_OP:
          await this.billingClient.normalizeCaseWithMoreThanOneOp((payload as Case)?._id)
          break

        case NORMALIZE_OPERATIONS.CASES_WITHOUT_NEEDED_INVOICE_TYPES:
          await this.billingClient
            .normalizeCaseWithoutNeededInvoiceTypes((payload as Case)?.caseId)
          break

        case NORMALIZE_OPERATIONS.CASES_WITHOUT_MISSING_INFO:
          await this.billingClient.normalizeCaseWithoutMissingInfo((payload as Case)?.caseId)
          break

        case NORMALIZE_OPERATIONS.CASES_WITHOUT_BILLING_CATEGORY:
          await this.billingClient.normalizeCaseWithoutBillingCategory((payload as Case)?.caseId)
          break
      }

      this.loggingService.logInfo(`Job ${job.id} completed`)
      await job.progress(100)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
