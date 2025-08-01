import {
  Component,
  tInvoicesPdfsArchive
} from '@smambu/lib.constantsjs'
import { Processor, Process } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'
import { NAMES } from 'src/utilities/constants'
import { EnvConfigsService, LoggingService } from '@smambu/lib.commons-be'
import { PdfArchiveService } from './pdfarchive.service'
import { ClientProxy } from '@nestjs/microservices'

@Processor(NAMES.PDFArchivesToDelete)
export class PdfArchiveDeleterConsumer {
  @Inject(PdfArchiveService)
  private readonly pdfArchiveService: PdfArchiveService

  @Inject(EnvConfigsService)
  private readonly envConfigClient: EnvConfigsService

  @Inject('BUCKET_CLIENT')
  private readonly bucketClient: ClientProxy

  constructor (
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BILLING)
  }

  @Process()
  async deleteArchive (job: Job<tInvoicesPdfsArchive>) {
    const deleteRequest = job.data
    // @ts-expect-error types are a mess right now!
    const requestId = deleteRequest._id
    const tenantId = deleteRequest.tenantId
    try {
      const logMessage = `Processing pdf archive generation request ${requestId} of user ${deleteRequest.creatorId}`
      this.loggingService.logInfo(logMessage, false)

      const als = (global as any).als
      const store = { tenantId }
      als.enterWith(store)

      await this.pdfArchiveService.deleteArchives(deleteRequest)

      await job.progress(100)

      this.loggingService.logInfo(`Job ${requestId} completed successfully`)
    } catch (e) {
      // we won't leave the job hanging - it will be deleted on the next "run"
      await job.progress(100)

      this.loggingService.logInfo(`Job ${requestId} completed with errors.
        Error:
        ${e}
        `)
    }
  }
}
