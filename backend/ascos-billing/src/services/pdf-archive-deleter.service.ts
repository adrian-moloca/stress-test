import { Inject, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { CronJob } from 'cron'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { NAMES, queueRetry } from 'src/utilities/constants'
import { EnvConfigsService, LoggingService } from '@smambu/lib.commons-be'
import { AsyncLocalStorage } from 'async_hooks'
import { TranslatorLanguages } from '@smambu/lib.constantsjs'
import { PdfArchiveService } from './pdfarchive.service'

@Injectable()
export class PdfArchiveDeleterService {
  @Inject(PdfArchiveService)
  private readonly pdfArchivesClient: PdfArchiveService

  async handleCron () {
    try {
      this.loggingService.logInfo('PDF Deleter service started', false)

      const pdfArchiveToDelete = await this.pdfArchivesClient.getAllDeletables()

      const promises = pdfArchiveToDelete.map(current => {
        const jobId = current.id

        this.loggingService.logInfo(`Job ${jobId} queued in the pdf archive deletion queue`, false)

        return this.archivesToDeleteQueue.add(current,
          {
            jobId,
            removeOnComplete: true,
            removeOnFail: true,
            ...queueRetry()
          })
      })

      await Promise.all(promises)
    } catch (e) {
      this.loggingService.logInfo(e, false)
    }
  }

  async init () {
    const translator = await this.envConfigClient.getTranslator(TranslatorLanguages.en)

    const cronPattern = this.configService.get('PDF_ARCHIVE_DELETER_CRONSTRING')

    if (!cronPattern) throw new Error(translator.fromLabel('missing_cronpattern'))

    const job = new CronJob(cronPattern, () => this.handleCron())

    this.schedulerRegistry.addCronJob('PDF Deleter Job', job)
    job.start()

    this.loggingService.logWarn(`PDF Deleter Job added with pattern ${cronPattern}`)
  }

  constructor (@InjectQueue(NAMES.PDFArchivesToDelete) private archivesToDeleteQueue: Queue,
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
