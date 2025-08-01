import {
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  booleanPermission,
  callMSWithTimeoutAndRetry,
  Component,
  createNotifications,
  InvoicePDFArchiveStatus,
  InvoiceType,
  NotificationActionType,
  NotificationType,
  permissionRequests,
  tAllEligiblesExportData,
  tCheckCaseAccess,
  tInvoicesPdfsArchive,
  tPDFArchiveGenerationRequest,
  UserPermissions,
} from '@smambu/lib.constantsjs'

import { LoggingService } from '@smambu/lib.commons-be'
import { InvoicesPdfsArchive } from 'src/schemas/invoicesPdfsArchive.schema'
import { GeneratedInvoice } from 'src/schemas/generatedInvoice.schema'
import { InjectQueue } from '@nestjs/bull'
import { NAMES, queueRetry } from 'src/utilities/constants'
import { Queue } from 'bull'
import { ClientProxy } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { subHours } from 'date-fns'
import { GeneratedInvoiceService } from './generatedInvoice.service'

@Injectable()
export class PdfArchiveService {
  constructor (
    @InjectModel(InvoicesPdfsArchive.name)
    private readonly invoicesPdfsArchiveModel: Model<InvoicesPdfsArchive>,
    @InjectModel(GeneratedInvoice.name)
    private readonly generatedInvoiceModel: Model<GeneratedInvoice>,
    @InjectQueue(NAMES.PDFArchivesQueue)
    private pdfArchivesQueue: Queue,
    @Inject('NOTIFICATIONS_CLIENT')
    private readonly notificationsClient: ClientProxy,

    @Inject('BUCKET_CLIENT')
    private readonly bucketClient: ClientProxy,

    @Inject('CASES_CLIENT')
    private readonly caseClient: ClientProxy,

    private readonly configService: ConfigService,

    private readonly loggingService: LoggingService,
    @Inject(GeneratedInvoiceService)
    private readonly generatedInvoicesClient: GeneratedInvoiceService
  ) {
    this.loggingService.setComponent(Component.BILLING)
  }

  async createIfNotExists (archiveData: tInvoicesPdfsArchive) {
    try {
      const newInvoice = await this.invoicesPdfsArchiveModel.create(archiveData)

      return newInvoice
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getDataForArchive (invoicesIds: string[]) {
    try {
      const invoices = await this.generatedInvoiceModel
        .find({ _id: { $in: invoicesIds } })
        .select({ casesRef: 1, pdfRef: 1 })

      return invoices
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async requestArchiveGeneration (archiveData: tInvoicesPdfsArchive,
    pdfFilenames: string[],
    creatorId: string,
    tenantId: string) {
    try {
      const res = await this.createIfNotExists(archiveData)

      const jobId = `archive_generation_${res._id}`

      const payload:tPDFArchiveGenerationRequest = {
        id: res._id.toString(),
        creatorId,
        tenantId,
        pdfFilenames
      }

      this.loggingService.logInfo(`Job ${jobId} queued in the pdf archives queue`, false)

      await this.pdfArchivesQueue.add(payload,
        {
          jobId,
          removeOnComplete: true,
          removeOnFail: true,
          ...queueRetry()
        })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async markAsGenerated (requestId: string, creatorId: string, archives: string[]) {
    try {
      const now = new Date()
      await this.invoicesPdfsArchiveModel.updateOne({
        _id: requestId
      },
      {
        filenames: archives,
        status: InvoicePDFArchiveStatus.READY_FOR_DOWNLOAD,
        generatedAt: now
      })

      createNotifications(this.notificationsClient, {
        usersIds: [creatorId],
        type: NotificationType.PDF_ARCHIVE_GENERATED,
        title: 'notifications_pdfArchiveReady_title',
        body: 'notifications_pdfArchiveReady_body',
        action: {
          type: NotificationActionType.INTERNAL_LINK,
          url: '/pdf-archives',
        },
      })

      return 'ok'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async markAsFailed (requestId: string, creatorId: string, failReason: string) {
    try {
      const now = new Date()
      await this.invoicesPdfsArchiveModel.updateOne({
        _id: requestId
      },
      {
        status: InvoicePDFArchiveStatus.ERROR_OCCURRED,
        failReason,
        generatedAt: now
      })

      createNotifications(this.notificationsClient, {
        usersIds: [creatorId],
        type: NotificationType.PDF_ARCHIVE_GENERATED,
        title: 'notifications_pdfArchiveReady_title',
        body: 'notifications_pdfArchiveReady_body',
        action: {
          type: NotificationActionType.INTERNAL_LINK,
          url: '/pdf-archives',
        },
      })

      return 'ok'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPdfArchives (page: number, pageSize: number, creatorId: string) {
    try {
      const total = await this.invoicesPdfsArchiveModel.countDocuments({ creatorId })

      const skip = page * pageSize
      const pdfArchives = await this.invoicesPdfsArchiveModel
        .find({
          creatorId
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(pageSize)

      return {
        results: pdfArchives,
        total,
        currentPage: page,
        limit: pageSize,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAllDeletables () {
    try {
      const maxLifetimeHours = this.configService.get('PDF_ARCHIVE_MAX_LIFE_HOURS')
      const now = new Date()
      const minDate = subHours(now, maxLifetimeHours)

      const res = await this.invoicesPdfsArchiveModel.find({
        generatedAt: { $lt: minDate },
        status: InvoicePDFArchiveStatus.READY_FOR_DOWNLOAD
      })

      const deletableIds = res.map(current => current.id)

      // we mark "ready for deletion" and then we delete with bull
      // this is just a "transitory" state to help detect a bull problem without
      // needing to open the actual bull logs, directly in the gui
      await this.invoicesPdfsArchiveModel.updateMany({
        _id: { $in: deletableIds }
      }, {
        status: InvoicePDFArchiveStatus.READY_FOR_DELETION
      })

      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteArchives (target: tInvoicesPdfsArchive) {
    try {
      const pattern = { role: 'file', cmd: 'deleteFiles' }

      const payloadData = {
        fileIds: target.filenames
      }
      await callMSWithTimeoutAndRetry(this.bucketClient,
        pattern,
        payloadData,
        Component.BILLING)

      await this.invoicesPdfsArchiveModel.updateOne({
      // @ts-expect-error types are a mess right now!
        _id: target._id
      }, {
        status: InvoicePDFArchiveStatus.DELETED
      })

      return 'ok'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async checkAccessToCases (casesIds: string[],
    user: any,
    userPermissions: UserPermissions):
    Promise<tCheckCaseAccess> {
    for (let caseId of [...casesIds]) {
      const pattern = { role: 'cases', cmd: 'getCasebyId' }

      const payloadData = {
        caseId,
        user,
        userPermissions,
        permissionCheck: true
      }
      const caseItem = await callMSWithTimeoutAndRetry(this.caseClient,
        pattern,
        payloadData,
        Component.BILLING)

      const props = { userPermissions, user, props: { caseItem } }
      const canAccessCase = booleanPermission(permissionRequests.canDownloadBill, props)

      if (!canAccessCase)
        return ({
          canAccessAllCases: false,
          firstForbiddenCaseId: caseId
        })
    }

    return ({
      canAccessAllCases: true
    })
  }

  async getAllEligiblesFiles (
    query:string,
    userPermissions: UserPermissions,
    datePattern: string,
    fromTimestamp: number,
    toTimestamp: number,
    invoiceTypes: InvoiceType[]
  ):Promise<tAllEligiblesExportData> {
    const invoices = await this.generatedInvoicesClient
      .findExportableForPDFArchives(
        query,
        userPermissions,
        datePattern,
        fromTimestamp,
        toTimestamp,
        invoiceTypes
      )

    const invoicesId: string[] = []
    const filenames: string[] = []

    invoices.forEach(current => {
      invoicesId.push(current.invoiceId)
      filenames.push(current.pdfRef)
    })

    return { invoicesId, filenames }
  }
}
