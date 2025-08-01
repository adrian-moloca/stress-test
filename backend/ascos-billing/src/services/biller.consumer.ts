import {
  IGeneratedInvoices,
  InvoiceStatus,
  InvoiceType,
  NotificationActionType,
  NotificationType,
  computeSammelCheckpoint,
  createNotifications,
  filterEmittablePcMaterialBillObjs,
  Component
} from '@smambu/lib.constantsjs'
import { Processor, Process } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'
import { NAMES } from 'src/utilities/constants'
import { GeneratedInvoiceService } from './generatedInvoice.service'
import { BillingService } from './billing.service'
import { BillobjService } from './billObj.service'
import { generateInvoicePdf } from 'src/utilities/pdf'
import { ClientProxy } from '@nestjs/microservices'
import { SammelCheckpointService } from './sammelcheckpoint.service'
import { EnvConfigsService, LoggingService } from '@smambu/lib.commons-be'
import { BillsObj } from 'src/schemas/billsObj.schema'

const path = require('node:path')

@Processor(NAMES.BillsQueue)
export class BillerService {
  @Inject(GeneratedInvoiceService)
  private readonly generatedInvoicesClient: GeneratedInvoiceService

  @Inject(BillingService)
  private readonly billingClient: BillingService

  @Inject(BillobjService)
  private readonly billObjClient: BillobjService

  @Inject('NOTIFICATIONS_CLIENT')
  private readonly notificationsClient: ClientProxy

  @Inject(SammelCheckpointService)
  private readonly sammelCheckpointClient: SammelCheckpointService

  @Inject(EnvConfigsService)
  private readonly envConfigClient: EnvConfigsService

  constructor (
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BILLING)
  }

  @Process()
  async generateBill (job: Job<IGeneratedInvoices>) {
    const bill = job.data
    const logMessage = `Processing bill ${bill.invoiceId}`
    this.loggingService.logInfo(logMessage, false)

    try {
      const tenantId = bill.tenantId

      const als = (global as any).als
      const store = { tenantId }
      als.enterWith(store)
      const translator = await this.envConfigClient.getTranslator()
      const currencySymbol = await this.envConfigClient.getAppCurrency()

      const invoiceCasesSnapshots = await this.generatedInvoicesClient
        .getInvoiceCasesSnapshots(bill)

      const allCasesHaveSnapshot = bill.casesRef
        .some(caseId => !invoiceCasesSnapshots.some(s => s.snapshot.case.caseId === caseId))

      if (allCasesHaveSnapshot)
        throw new Error('error_at_list_one_case_withot_snapshot')

      const isCancellation = bill.type === InvoiceType.CREDIT_NOTE

      let billObjs = invoiceCasesSnapshots
        .reduce((acc, s) => acc.concat(s.billObjs), [] as BillsObj[])

      if (billObjs.length === 0)
        billObjs = await this.billObjClient.findManyByBillObjIds(job.data.billObjRefs)

      const isPcMaterial = billObjs.some(b => b.type === InvoiceType.PC_MATERIALS)
      const generalData = invoiceCasesSnapshots[0].snapshot.generalData
      let pdfName, fileId, needsDeletion

      if (!isPcMaterial) {
        const cases = invoiceCasesSnapshots.map(s => s.snapshot.case)
        const encodedPdf = await generateInvoicePdf(translator,
          generalData,
          bill,
          billObjs,
          cases,
          currencySymbol)

        const folderPrefix = process.env.BILLING_PDF_FOLDER
        pdfName = path.join(folderPrefix, `${bill.invoiceId}.pdf`)

        const result = await this.generatedInvoicesClient.sendPdfToBucket(encodedPdf, pdfName)
        fileId = result.fileId

        const updatedInvoiceStatus = isCancellation
          ? InvoiceStatus.CANCELLED
          : InvoiceStatus.EMITTED

        await this.billObjClient
          .updateManyByBillObjStatuses(bill.billObjRefs, updatedInvoiceStatus)
      } else {
        if (isCancellation) {
          await this.generatedInvoicesClient.cancelPcMaterialsInvoice(bill, undefined, billObjs)
          await this.billObjClient.updateManyByBillObjStatuses(
            bill.billObjRefs,
            InvoiceStatus.CANCELLED
          )
        } else {
          const snapshot = invoiceCasesSnapshots[0].snapshot
          const doctor = snapshot.contract.associatedDoctor

          const previousCheckpoint = await this.sammelCheckpointClient
            .findLatestBySurgeon(doctor.id)

          const EmittableBillObjs = filterEmittablePcMaterialBillObjs(billObjs,
            previousCheckpoint)

          if (EmittableBillObjs.length > 0) {
            const previousConsumption = previousCheckpoint?.consumptions ?? []
            const checkpoint = computeSammelCheckpoint(EmittableBillObjs,
              previousConsumption,
              doctor.id)

            const createdCheckpoint = await this.sammelCheckpointClient
              .createCheckpoint(checkpoint, bill.creatorId)

            await this.generatedInvoicesClient.updateOne({
              ...bill,
              billObjRefs: EmittableBillObjs.map(b => b.billObjId),
              casesRef: EmittableBillObjs.map(b => b.caseId),
              patients: EmittableBillObjs.map(b => b.patient)
            }, undefined)

            await this.generatedInvoicesClient
              .setSammelCheckpointRef(bill.invoiceId, createdCheckpoint.id)

            await this.billObjClient.updateManyByBillObjStatuses(
              EmittableBillObjs.map(b => b.billObjId),
              isCancellation ? InvoiceStatus.CANCELLED : InvoiceStatus.EMITTED
            )
          } else {
            needsDeletion = true
          }
        }
      }

      await this.generatedInvoicesClient.markAsGenerated(bill.invoiceId, fileId)

      // if this is a sammel invoice that doesn't have a "prescribable" checkpoint,
      // we delete it
      if (needsDeletion)
        this.generatedInvoicesClient.deleteOneByInvoiceId(bill.invoiceId)

      const notificationType = isCancellation
        ? NotificationType.BILL_CANCELLATION_GENERATED
        : NotificationType.BILL_STANDARD_GENERATED

      const notificationTitle = isCancellation
        ? 'notifications_billCancellationGenerated_title'
        : 'notifications_billStandardGenerated_title'

      const notificationBody = isCancellation
        ? 'notifications_billCancellationGenerated_body'
        : 'notifications_billStandardGenerated_body'

      await createNotifications(
        this.notificationsClient,
        {
          usersIds: [bill.creatorId],
          type: notificationType,
          title: notificationTitle,
          body: notificationBody,
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: '/casebilling',
          },
        }
      )

      await this.billingClient.updateCaseBilledStatus(bill.casesRef, isCancellation)
      await this.billObjClient.updateManyByBillObj(billObjs.map(billObj => ({
        billObjId: billObj.billObjId,
        elaborationInProgress: false
      })))

      await job.progress(100)

      this.loggingService.logInfo(`Job ${bill.invoiceId} completed`, false)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
