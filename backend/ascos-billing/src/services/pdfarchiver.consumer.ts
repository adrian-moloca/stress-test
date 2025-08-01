import {
  callMSWithTimeoutAndRetry,
  Component,
  tPDFArchiveGenerationRequest
} from '@smambu/lib.constantsjs'
import { Processor, Process } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'
import { NAMES } from 'src/utilities/constants'
import { EnvConfigsService, LoggingService } from '@smambu/lib.commons-be'
import { PdfArchiveService } from './pdfarchive.service'
import { ClientProxy } from '@nestjs/microservices'

@Processor(NAMES.PDFArchivesQueue)
export class PdfArchiverConsumer {
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
  async generateArchive (job: Job<tPDFArchiveGenerationRequest>) {
    const pdfArchiveRequest = job.data
    const { id, creatorId, pdfFilenames, tenantId } = pdfArchiveRequest
    try {
      const logMessage = `Processing pdf archive generation request ${id} by user ${creatorId}`
      this.loggingService.logInfo(logMessage, false)

      const als = (global as any).als
      const store = { tenantId }
      als.enterWith(store)

      const pattern = { role: 'file', cmd: 'zipPDFArchive' }

      const payloadData = {
        sourceFiles: pdfFilenames,
        maxArchiveSize: process.env.MAX_ARCHIVE_SIZE_KB,
        maxFilesPerArchive: process.env.MAX_INVOICES_PER_ARCHIVE
      }
      const archives = await callMSWithTimeoutAndRetry(this.bucketClient,
        pattern,
        payloadData,
        Component.BILLING)

      await this.pdfArchiveService.markAsGenerated(id, creatorId, archives)

      await job.progress(100)

      this.loggingService.logInfo(`Job ${id} completed successfully`)
    } catch (e) {
      const message = e.message
      await this.pdfArchiveService.markAsFailed(id, creatorId, message)

      await job.progress(100)

      this.loggingService.logInfo(`Job ${id} completed with errors`)
    }
  }
}
