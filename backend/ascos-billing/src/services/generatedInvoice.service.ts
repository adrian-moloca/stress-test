import {
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { ClientProxy } from '@nestjs/microservices'
import {
  BillsListCSVExport,
  Case,
  Component,
  IDebtor,
  IGeneratedInvoices,
  IUser,
  ISystemConfigurationRevenueAccountRow,
  InvoiceStatus,
  InvoiceType,
  PaginatedInvoiceResponse,
  UserPermissions,
  formatDebtorName,
  systemConfigurationSections,
  EntityType,
  auditTrailCreate,
  auditTrailUpdate,
  getCapabilityUsers,
  PERMISSIONS_DOMAINS_SCOPES,
  Capabilities,
  callMSWithTimeoutAndRetry,
  isValidNumber,
  ICancelPayloadItem,
  getBillDueDate,
  IBillObj,
  getParsedSammelsFromBillobjs,
  ICredential,
  exportableInvoicesStatuses,
  sanitizeRegex,
} from '@smambu/lib.constantsjs'

import { GeneratedInvoice } from 'src/schemas/generatedInvoice.schema'
import { toDate } from 'date-fns-tz'
import { format, isValid, lastDayOfMonth } from 'date-fns'
import { BillingService } from './billing.service'
import { SammelCheckpointService } from './sammelcheckpoint.service'
import { BillobjService } from './billObj.service'
import { SnapshotService } from './snapshot.service'
import { InvoicesCasesSnapshot } from 'src/schemas/invoiceCasesSnapshots'

import { ObjectId } from 'mongodb'
import { EnvConfigsService, LoggingService, RedisClientService } from '@smambu/lib.commons-be'
import Translator from '@smambu/lib.constantsjs/lib/translator'

@Injectable()
export class GeneratedInvoiceService {
  constructor (
    @Inject('CASES_CLIENT')
    private readonly casesClient: ClientProxy,

    @Inject('BUCKET_CLIENT')
    private readonly bucketClient: ClientProxy,

    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,

    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,

    @Inject('USERS_CLIENT')
    private readonly usersClient: ClientProxy,

    @Inject(RedisClientService)
    private readonly redis: RedisClientService,

    @Inject(BillingService)
    private readonly billingClient: BillingService,

    @Inject(SammelCheckpointService)
    private readonly sammelChecpointClient: SammelCheckpointService,

    @InjectModel(GeneratedInvoice.name)
    private readonly generatedInvoiceModel: Model<GeneratedInvoice>,

    private readonly billObjService: BillobjService,

    @InjectModel(InvoicesCasesSnapshot.name)
    private readonly invoicesCasesSnapshot: Model<InvoicesCasesSnapshot>,

    @Inject(SnapshotService)
    private readonly snapshotClient: SnapshotService,

    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,

    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BILLING)
  }

  async checkCasesInvoicesValidity (casesIds: string[]) {
    const pattern = { role: 'cases', cmd: 'checkCasesInvoicesValidity' }

    const payloadData = { casesIds }
    const res = await callMSWithTimeoutAndRetry(this.casesClient,
      pattern,
      payloadData,
      Component.BILLING)

    return res
  }

  async createIfNotExists (invoiceData: IGeneratedInvoices, user: IUser) {
    try {
      // TODO: add audit
      await this.redis.redislock
        .using(['createInvoice'], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
          const pattern = { role: 'cases', cmd: 'getCasesbyIdsWithotPermission' }

          const payloadData = { caseIds: invoiceData.casesRef }
          const cases = await callMSWithTimeoutAndRetry(this.casesClient,
            pattern,
            payloadData,
            Component.BILLING)

          const doctorsIds = cases.reduce((acc, c) => {
            if (!acc.includes(c.bookingSection.doctorId)) acc.push(c.bookingSection.doctorId)
            return acc
          }, [])
          const billObjs = await this.billObjService.findManyByBillObjIds(invoiceData.billObjRefs)
          if (invoiceData.type === InvoiceType.CREDIT_NOTE) {
            if (billObjs.some(billObj => billObj.status !== InvoiceStatus.EMITTED))
              throw new Error('create_invoice_error_billobjt_not_refundable')
          } else {
            if (billObjs.some(billObj => billObj.status === InvoiceStatus.EMITTED))
              throw new Error('create_invoice_error_billobjt_not_generable')
          }

          if (billObjs.some(billObj => billObj.elaborationInProgress))
            throw new Error('create_invoice_error_billobjt_already_in_elaboration')

          const invoiceNumber = await this.billingClient.getInvoiceNumber(invoiceData)
          const totalOwed = billObjs.reduce((acc, curr) =>
            isValidNumber(curr?.totalOwed) ? curr?.totalOwed + acc : acc,
          0)
          const newInvoice = await this.generatedInvoiceModel.create({
            ...invoiceData,
            creatorId: user.id,
            invoiceNumber,
            doctorsIds,
            totalOwed,
          })

          await this.generatedInvoiceModel.updateOne({
            _id: new ObjectId(newInvoice.id),
          }, { invoiceId: newInvoice.id })

          const snapshots = await this.snapshotClient.findMultipleByCaseIds(invoiceData.casesRef)
          await this.invoicesCasesSnapshot.insertMany(snapshots.map(s => {
            const snapshot = s.toObject()
            return ({
              invoiceId: newInvoice.id,
              invoiceType: invoiceData.type,
              snapshot,
              billObjs: billObjs
                .filter(b => snapshot.case._id === b.caseId)
                .map(b => b.toObject())
            })
          }))
          await this.billObjService.updateManyByBillObj(billObjs.map(bilObj => ({
            billObjId: bilObj.billObjId,
            elaborationInProgress: true
          })))

          await auditTrailCreate({
            logClient: this.logClient,
            userId: user.id,
            entityType: EntityType.INVOICE,
            newObj: newInvoice.toJSON(),
          })
          return newInvoice
        })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getByInvoiceId (invoiceId: string) {
    try {
      const generatedInvoice = await this.generatedInvoiceModel.findOne({ invoiceId })

      return generatedInvoice
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getInvoicesToGenerate (skipTenant: boolean = false) {
    try {
      if (skipTenant) {
        const als = global.als
        const store = { bypassTenant: true }
        als.enterWith(store)
      }

      const invoicesToGenerate = await this.generatedInvoiceModel
        .find({ pdfRef: null, status: InvoiceStatus.CREATED, debtor: { $exists: true } })

      return invoicesToGenerate
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async markAsGenerated (invoiceId: string, pdfRef: string) {
    try {
      const invoicesToGenerate = await this.generatedInvoiceModel.findOneAndUpdate(
        { invoiceId },
        { pdfRef, status: InvoiceStatus.EMITTED }
      )

      return invoicesToGenerate
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async sendPdfToBucket (encodedPdf: string, fileName: string) {
    try {
      const pattern = { role: 'file', cmd: 'uploadBase64' }

      const payloadData = {
        fileEncoded: encodedPdf, fileName
      }
      const fileResponse = await callMSWithTimeoutAndRetry(this.bucketClient,
        pattern,
        payloadData,
        Component.BILLING)

      return fileResponse
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findByBillObjsIds (billObjsIds: string[]) {
    try {
      const res = await this.generatedInvoiceModel
        .find({ billObjRefs: { $in: billObjsIds } })
        .sort({ createdAt: 'desc' })
      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateOne (generatedInvoice: GeneratedInvoice | IGeneratedInvoices, userId: string) {
    try {
      const { invoiceId } = generatedInvoice
      const oldData = await this.generatedInvoiceModel.findOne({ invoiceId })
      const newValue = await this.generatedInvoiceModel.findOneAndUpdate({ invoiceId },
        generatedInvoice)

      await auditTrailUpdate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.BILL,
        prevObj: oldData.toJSON(),
        newObj: newValue.toJSON(),
      })
      return newValue
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async hidrateInvoices (invoices: IGeneratedInvoices[], userPermissions: UserPermissions) {
    const casesIds = new Set<string>()
    invoices.forEach(invoice => invoice
      .casesRef.forEach(caseId => casesIds.add(caseId)))

    const caseItems = await this.billingClient.getCasesById([...casesIds], userPermissions)

    const sammelCheckpointsIds = invoices.map(current => current.sammelCheckpointRef)

    const sammelCheckpoints = await this.sammelChecpointClient
      .findMultiplesById(sammelCheckpointsIds)

    return invoices
      .map(invoice => {
        const cases = caseItems.filter(caseItem => invoice
          .casesRef.includes(caseItem.id))

        const sammelCheckpoint = sammelCheckpoints
          .find(current => current.id === invoice.sammelCheckpointRef)

        return {
          invoiceId: invoice.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          generatedAt: invoice.generatedAt,
          recipient: invoice.recipient,
          debtor: invoice.debtor,
          patients: invoice.patients,
          cases,
          type: invoice.type,
          originalInvoiceId: invoice.originalInvoiceId,
          originalInvoiceNumber: invoice.originalInvoiceNumber,
          status: invoice.status,
          billObjRefs: invoice.billObjRefs,
          dueDate: invoice.dueDate,
          total: invoice.total,
          pdfRef: invoice.pdfRef,
          sammelCheckpoint,
          paid: invoice.paid,
          posted: invoice.posted
        }
      })
  }

  getInvoicesOwners (userPermissions: UserPermissions) {
    const invoicesViewOwners = getCapabilityUsers(Capabilities.P_BILLS_VIEW, userPermissions)
    let associatedUsersIds: string[] = []
    let canViewAllInvoices = false
    if (invoicesViewOwners === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
      canViewAllInvoices = true
    else
      associatedUsersIds.push(...invoicesViewOwners)

    associatedUsersIds = associatedUsersIds.reduce((acc, curr) => {
      if (!acc.includes(curr)) acc.push(curr)
      return acc
    }, [])
    return { canViewAllInvoices, associatedUsersIds }
  }

  async fullTextSearchInvoicesWithTotal (
    query: string,
    page: number,
    limit: number,
    userPermissions: UserPermissions,
    sortBy: string,
    sortOrder: string,
    datePattern: string,
    defaultPaginationLimit: number,
    fromTimestamp?: number,
    toTimestamp?: number,
    casesIds?: string[],
    postedStatus?: boolean,
    invoiceTypes?: InvoiceType[],
    withPdf?: boolean,
    escludedOriginalInvoiceType?: InvoiceType[]
  ) {
    const { canViewAllInvoices, associatedUsersIds } = this.getInvoicesOwners(userPermissions)
    const queryTokens = query?.split(' ')
    const queryStrings = []
    const queryDates = []
    queryTokens?.forEach(token => {
      // TODO: this is not good enough, we need to find a better way to parse dates
      const datePatternParts = datePattern.split('/')
      const dateParts = token.split('/')

      const month = dateParts?.[datePatternParts.indexOf('MM')]
      const day = dateParts?.[datePatternParts.indexOf('dd')]
      const year = dateParts?.[datePatternParts.indexOf('yyyy')]

      const dateString = `${year}-${month}-${day}`
      const date = toDate(dateString, {
        timeZone: 'UTC',
      })

      if (isValid(date))
        queryDates.push(date)
      else
        if (token)
          queryStrings.push(sanitizeRegex(token))
    })

    const dateFilter = fromTimestamp || toTimestamp

    const postedFilter = postedStatus !== undefined ? { posted: postedStatus } : {}
    const withPdfFilter = withPdf === true
      ? {
        $or: [
          {
            pdfRef: { $exists: true }
          }
        ]
      }
      : {}

    const invoiceTypesProvided = invoiceTypes != null && invoiceTypes.length > 0
    const invoiceTypeFilter = invoiceTypesProvided
      ? {
        $or: [
          {
            type: { $in: invoiceTypes }
          }
        ]
      }
      : {}

    const mongoQuery = {
      ...postedFilter,
      ...withPdfFilter,
      ...invoiceTypeFilter,
      ...(!canViewAllInvoices && {
        doctorsIds: {
          $in: associatedUsersIds,
        }
      }),
      ...(casesIds && { casesRef: { $in: casesIds } }),
      ...(dateFilter && {
        generatedAt: {
          ...(fromTimestamp && { $gte: new Date(fromTimestamp) }),
          ...(toTimestamp && { $lte: new Date(toTimestamp) }),
        }
      }),
      // originalInvoiceType
      ...(escludedOriginalInvoiceType != null && {
        originalInvoiceType: {
          $nin: escludedOriginalInvoiceType
        }
      }),
      ...(queryStrings.length && {
        $or: [
          {
            invoiceNumber: {
              $regex: queryStrings.join('|'),
              $options: 'i',
            },
          },
          {
            recipient: {
              $regex: queryStrings.join('|'),
              $options: 'i',
            },
          },
          {
            type: {
              $regex: queryStrings.join('|'),
              $options: 'i',
            },
          },
          {
            status: {
              $regex: queryStrings.join('|'),
              $options: 'i',
            },
          },
          {
            'debtor.debtorNumber': {
              $regex: queryStrings.join('|'),
              $options: 'i',
            },
          },
          {
            'debtor.firstName': {
              $regex: queryStrings.join('|'),
              $options: 'i',
            },
          },
          {
            'debtor.lastName': {
              $regex: queryStrings.join('|'),
              $options: 'i',
            },
          },
          {
            casesRef: {
              $elemMatch: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              }
            }
          },
          {
            patients: {
              $elemMatch: {
                patientId: {
                  $regex: queryStrings.join('|'),
                  $options: 'i',
                }
              }
            }
          }
        ],
      }),
      ...(queryDates.length && {
        $or: [
          {
            generatedAt: {
              $in: queryDates,
            },
          },
          {
            dueDate: {
              $in: queryDates,
            }
          }],
      }),
    }

    const total = await this.generatedInvoiceModel.countDocuments(mongoQuery)

    const invoices = await this.generatedInvoiceModel
      .find(mongoQuery)
      .sort({
        ...(sortBy &&
          sortOrder && { [sortBy]: sortOrder === 'asc' ? 1 : -1 }),
      })
      .skip(
        (!isNaN(Number(page)) ? Number(page) : 0) *
        (!isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit),
      )
      .limit(!isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit)

    return { total, invoices }
  }

  async fullTextSearchInvoices (
    query: string,
    page: number,
    limit: number,
    userPermissions: UserPermissions,
    sortBy: string,
    sortOrder: string,
    datePattern: string,
    defaultPaginationLimit: number,
    fromTimestamp?: number,
    toTimestamp?: number,
    casesIds?: string[],
  ): Promise<PaginatedInvoiceResponse> {
    try {
      const { total, invoices } = await this.fullTextSearchInvoicesWithTotal(
        query,
        page,
        limit,
        userPermissions,
        sortBy,
        sortOrder,
        datePattern,
        defaultPaginationLimit,
        fromTimestamp,
        toTimestamp,
        casesIds,
        undefined,
        undefined,
        undefined,
        [InvoiceType.PC_MATERIALS],
      )

      const parsedInvoices = await this.hidrateInvoices(invoices, userPermissions)

      return {
        results: parsedInvoices,
        total,
        currentPage: !isNaN(Number(page)) ? Number(page) : 0,
        limit: !isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getRevenueData (): Promise<ISystemConfigurationRevenueAccountRow[]> {
    try {
      const pattern = { role: 'SystemConfigurationSection', cmd: 'get' }

      const payloadData = {
        // @ts-expect-error DYNAMIC DATA IS BROKEN
        section: systemConfigurationSections.REVENUE_ACCOUNT
      }
      const generalData = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        payloadData,
        Component.BILLING)

      return generalData?.data ?? []
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findExportable (
    type: BillsListCSVExport,
    userPermissions: UserPermissions,
    datePattern: string,
    invoiceIds?: string[],
    fromTimestamp?: number,
    toTimestamp?: number,
    query?: string
  ) {
    // Taken from us 177
    //
    // Only bills in “paid” or “cancelled”  status can be exported,
    // in the latter case the bill will become “posted_cancelled”
    // As soon as the CSV is downloaded, the selected bills’
    // state changes to “POSTED” automatically
    //
    // we modified it slightly and we allow the posted (and posted cancelled)
    // to be exported anyway, to simplify the process
    try {
      const isRecipient = type === BillsListCSVExport.RECIPIENT
      // XXX This is not the rule, just a happy coincidence :)
      // the logic is to export posted only for recipients and un-posted only for
      // invoices, so the logic matches up nicely
      const postedStatus = isRecipient

      if (invoiceIds?.length > 0) {
        const query: { [key: string]: any } = {
          invoiceId: { $in: invoiceIds }
        }

        const res = await this.generatedInvoiceModel.find(query)
        return res
      } else {
        const { invoices } = await this.fullTextSearchInvoicesWithTotal(
          query,
          0,
          Infinity,
          userPermissions,
          null,
          null,
          datePattern,
          Infinity,
          fromTimestamp,
          toTimestamp,
          undefined,
          postedStatus
        )

        return invoices
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  getInvoicesCsv = (translator: Translator,
    invoice: GeneratedInvoice,
    caseItem: Case,
    revenueData: ISystemConfigurationRevenueAccountRow[]) => {
    try {
      // revenueAccount: the "invoice revenue account" or the
      // "credit note revenue account" depending on whether the invoice is "normal" or a "credit note"
      // debtorNumber: taken from the invoice
      // debtorName: the name of the debtor (could be an entity such as an embassy)
      // amount: the bill.totalOwed, with a minus sign in front of it in the case of credit notes
      // monthEnd: the last day of the month in which the last surgery in the bill took place
      // invoiceNumber: the number of the invoice or the credit note
      // costCenter: the "cost center" corresponding to the revenue account
      // dueDate: bill.dueDate
      // freeze: 0 (a constant value)
      // @ts-expect-error DYNAMIC DATA IS BROKEN
      const billingCategory = caseItem.billingSection.billingCategory

      const targetRevenue = revenueData.find(current => current.categoryId === billingCategory)

      if (!targetRevenue) throw new Error(`no_revenue_for_${billingCategory}`)

      const isCreditNote = invoice.type === InvoiceType.CREDIT_NOTE

      const revenueAccount = isCreditNote
        ? targetRevenue.creditNoteAccount
        : targetRevenue.revenueAccount

      if (!revenueAccount) throw new Error(`no_revenue_detail_for_${billingCategory}_${isCreditNote ? 'invoice' : 'credit'}`)

      const debtorOriginalInvoicePrefix = translator.fromLabel('csv_debtor_original_invoice_prefix')
      const debtorAdditionalData = isCreditNote ? `${debtorOriginalInvoicePrefix} ${invoice.invoiceNumber} ` : ''
      const debtorName = `${debtorAdditionalData}${formatDebtorName(invoice.debtor)}`
      const debtorNumber = invoice.debtor.debtorNumber

      const amount = isCreditNote ? invoice.total * -1 : invoice.total
      const monthEnd = format(lastDayOfMonth(new Date(caseItem.bookingSection.date)), 'dd.MM.yyyy')

      const invoiceNumber = isCreditNote ? invoice.originalInvoiceNumber : invoice.invoiceNumber
      const costCenter = targetRevenue.costCenter

      if (!costCenter) throw new Error(`no_cost_center_for_${billingCategory}`)

      const dueDate = format(new Date(invoice.dueDate), 'ddMMyy')
      const freeze = '0'

      return ({
        revenueAccount,
        debtorNumber,
        debtorName,
        amount: Number(amount.toFixed(2)),
        monthEnd,
        invoiceNumber,
        costCenter,
        dueDate,
        freeze
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  getRecipientsCsv = (debtor: IDebtor) => {
    // debtorNumber: the same used for the invoice
    // debtorName: the name of the debtor (could be an entity such as an embassy)
    // streetNo: street and number of the debtor's address
    // postalCode: postal code of the debtor's address
    // city: the name of the city of the debtor's addrees
    return ({
      debtorNumber: debtor.debtorNumber,
      debtorName: formatDebtorName(debtor),
      streetNo: `${debtor.street} ${debtor.houseNumber}`,
      postalCode: debtor.postalCode,
      city: debtor.city,
    })
  }

  async getCsvData (invoices: GeneratedInvoice[], exportType: BillsListCSVExport,
    userPermissions: UserPermissions) {
    try {
      const translator = await this.envConfigClient.getTranslator()

      const revenueData = await this.getRevenueData()

      if (revenueData.length === 0)
        throw new Error('no_revenue_data')

      if (exportType === BillsListCSVExport.RECIPIENT)
        return invoices.map(({ debtor }) => this.getRecipientsCsv(debtor))

      const promises = invoices.map(invoice => {
        // in order to get the correct revenue we need the billing category
        // this is currently in the case object
        // since every case of a given bill share the same category, we get the
        // latest "done" (temporally) in order to have the right data for the
        // monthEnd field of the csv
        return this.billingClient.getMostRecentCaseInIds(invoice.casesRef, userPermissions)
          .then((caseItem: Case) => this.getInvoicesCsv(translator, invoice, caseItem, revenueData))
      })

      return Promise.all(promises)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateExportable (invoices: GeneratedInvoice[], exportType: BillsListCSVExport) {
    try {
      if (exportType === BillsListCSVExport.RECIPIENT) return 'done'

      const toPost = []

      invoices.forEach(({ status, invoiceId }) => {
        if (exportableInvoicesStatuses.includes(status)) toPost.push(invoiceId)
      })

      if (toPost.length === 0)
        return null

      await this.generatedInvoiceModel
        .updateMany({ invoiceId: { $in: toPost } },
          { posted: true })

      return 'done'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async setPaid (invoiceId: string) {
    try {
      await this.generatedInvoiceModel.findOneAndUpdate({ invoiceId }, {
        $set: {
          paid: true,
        }
      })

      return 'done'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async setSammelCheckpointRef (invoiceId: string, sammelCheckpointRef: string) {
    try {
      const invoicesToGenerate = await this.generatedInvoiceModel.findOneAndUpdate(
        { invoiceId },
        { sammelCheckpointRef }
      )

      return invoicesToGenerate
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteOneByInvoiceId (invoiceId: string) {
    try {
      await this.generatedInvoiceModel.deleteOne({ invoiceId })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteByCaseId (caseId: string) {
    try {
      const invoicesWithPdfRefs = await this.generatedInvoiceModel.find({
        casesRef: caseId,
        pdfRef: { $exists: true }
      })
      const pdfRefs = invoicesWithPdfRefs.map(i => i.pdfRef).filter(Boolean)
      await this.bucketClient.send({ role: 'file', cmd: 'deleteFiles' }, { filesIds: pdfRefs })

      await this.generatedInvoiceModel.deleteMany({ casesRef: caseId })
      await this.invoicesCasesSnapshot.deleteMany({ 'snapshot.case._id': caseId })

      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async setPrescribed (invoiceId: string) {
    try {
      await this.generatedInvoiceModel.findOneAndUpdate({ invoiceId },
        { $set: { status: InvoiceStatus.PRESCRIBED } })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getInvoceIdFromBillObj (objId: string) {
    try {
      const generatedInvoice = await this.generatedInvoiceModel.find({
        $or: [
          {
            status: InvoiceStatus.EMITTED
          },
          {
            status: InvoiceStatus.PARTIALLY_CANCELLED
          }
        ],
        type: {
          $ne: InvoiceType.CREDIT_NOTE
        },
        billObjRefs: {
          $in: [objId]
        }
      }).limit(1)
        .sort({ $natural: -1 })
      return generatedInvoice?.[0]?.invoiceId
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getInvoceNumberFromBillObj (objId: string) {
    try {
      const generatedInvoice = await this.generatedInvoiceModel.find({
        $or: [
          {
            status: InvoiceStatus.EMITTED
          },
          {
            status: InvoiceStatus.PARTIALLY_CANCELLED
          }
        ],
        type: {
          $ne: InvoiceType.CREDIT_NOTE
        },
        billObjRefs: {
          $in: [objId]
        }
      }).limit(1)
        .sort({ $natural: -1 })
      return generatedInvoice?.[0]?.invoiceNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async cancelBills (data: ICancelPayloadItem[], user: IUser) {
    const flattenedBillObjs = data.reduce((acc, curr) => {
      acc = [...acc, ...curr.billObjsIds]

      return acc
    }
    , [])
    const orderedTargetInvoices = await this.findByBillObjsIds(flattenedBillObjs)

    const invoicesToRefund = flattenedBillObjs.reduce((acc, billObjId) => {
      const invoice = orderedTargetInvoices.find(
        invoice =>
          invoice.billObjRefs.includes(billObjId) &&
          invoice.type !== InvoiceType.CREDIT_NOTE &&
          invoice.status !== InvoiceStatus.CANCELLED
      )
      if (!invoice)
        throw new Error('invoice_not_found_for_billobj')

      if (acc.find(i => i.invoiceId === invoice.invoiceId)) return acc
      acc.push(invoice)
      return acc
    }, []) as IGeneratedInvoices[]

    if (!invoicesToRefund?.length) throw new Error('no invoice to refund')

    if (invoicesToRefund?.length)
      await this.cancelgeneratedInvoices(invoicesToRefund, flattenedBillObjs, data, user)

    return 'done'
  }

  async cancelPcMaterialsInvoice (invoiceToRefund: IGeneratedInvoices,
    user: IUser | undefined,
    billObjs: IBillObj[]) {
    if (billObjs.some(b => b.type !== InvoiceType.PC_MATERIALS)) throw new Error('error_at_least_one_bilobj_is_not_pc_materials')
    if (!invoiceToRefund.doctorsIds.length) throw new Error('error_pc_materials_without_doctor')
    if (invoiceToRefund.doctorsIds.length > 1) throw new Error('error_pc_materials_to_much_doctors')

    const lastDoctorCheckpoint = await this.sammelChecpointClient
      .findLatestBySurgeon(invoiceToRefund.doctorsIds[0])
    const checkpoint = await this.sammelChecpointClient
      .findById(invoiceToRefund.sammelCheckpointRef)
    if (!checkpoint) throw new Error('error_checkpoint_not_found')

    const sammelArticles = getParsedSammelsFromBillobjs(billObjs)
    const newConsumptions = Object.values(sammelArticles).map(s => {
      const lastChekpointRemainder = lastDoctorCheckpoint?.consumptions
        ?.find(c => c.itemCode === s.materialId)?.remainder ?? 0
      const totalRevenue = checkpoint?.consumptions
        ?.find(c => c.itemCode === s.materialId)?.usedAmount
      const newRemainder = lastChekpointRemainder - (s.total - totalRevenue)

      return {
        totalAmount: 0,
        totalAmountWithPrevious: 0,
        billingAmount: 0,
        usedAmount: 0,
        remainder: newRemainder,
        description: s.description,
        itemCode: s.materialId,
      }
    })

    const consumptions = newConsumptions
      .concat(lastDoctorCheckpoint.consumptions
        .filter(c => !newConsumptions
          .find(c2 => c2.itemCode === c.itemCode)))

    await this.sammelChecpointClient.createCheckpoint({
      doctorId: invoiceToRefund.doctorsIds[0],
      consumptions,
      createdAt: new Date()
    }, user?.id)
  }

  async cancelgeneratedInvoices (
    invoicesToRefund: IGeneratedInvoices[],
    flattenedBillObjs: string[],
    data: ICancelPayloadItem[],
    user: IUser
  ) {
    const billObjs = await this.billObjService.findManyByBillObjIds(flattenedBillObjs)
    const newInvoices = []
    await Promise.all(invoicesToRefund.map(async el => {
      const newInvoice = <IGeneratedInvoices>{ type: InvoiceType.CREDIT_NOTE }

      newInvoice.originalInvoiceId = el.invoiceId
      newInvoice.originalInvoiceNumber = el.invoiceNumber
      newInvoice.originalInvoiceType = el.type

      newInvoice.generatedAt = new Date()
      newInvoice.dueDate = getBillDueDate(new Date(), InvoiceType.CREDIT_NOTE)
      newInvoice.status = InvoiceStatus.CREATED

      newInvoice.recipient = el.recipient
      newInvoice.debtor = el.debtor
      newInvoice.patients = el.patients
      newInvoice.posted = false

      if (el?.sammelCheckpointRef)
        newInvoice.sammelCheckpointRef = el.sammelCheckpointRef

      let newBillObjsRef = new Set<string>()
      let newCasesRefs = new Set<string>()

      el.billObjRefs.forEach(billObjRef => {
        // se la invoice corrente è la più recente per questo billobj ref allora lo pusho
        const matchingItems = data.filter(current => current.billObjsIds.includes(billObjRef))

        if (matchingItems.length > 0) {
          newBillObjsRef.add(billObjRef)

          el.casesRef.filter(current =>
            matchingItems.some(item =>
              item.cases.includes(current)))
            .forEach(current => newCasesRefs.add(current))
        }
      })

      newInvoice.casesRef = [...newCasesRefs]
      newInvoice.billObjRefs = [...newBillObjsRef]

      newInvoice.total = billObjs.reduce((acc, curr) => {
        if (newBillObjsRef.has(curr.billObjId))
          return !isNaN(acc + curr.totalSum) ? (acc += curr.totalSum) : acc

        return acc
      }, 0)

      newInvoices.push(newInvoice)
    }))

    const createNewInvoicePromises = newInvoices
      .map(invoice => this.createIfNotExists(invoice, user))

    await Promise.all(createNewInvoicePromises)

    const billObjService = this.billObjService
    const editOldPromises = invoicesToRefund.map(async invoice => {
      const invoiceBillObjs = await billObjService.findManyByBillObjIds(invoice.billObjRefs)
      const allCanceled = invoice.billObjRefs
        .every(current => flattenedBillObjs.includes(current) ||
      invoiceBillObjs?.find?.(b => b.billObjId === current)?.status === InvoiceStatus.CANCELLED)

      invoice.status = allCanceled ? InvoiceStatus.CANCELLED : InvoiceStatus.PARTIALLY_CANCELLED

      return this.updateOne(invoice, user.id)
    })

    await Promise.all(editOldPromises)
    const newBillObjs = await this.billObjService.findManyByBillObjIds(flattenedBillObjs)
    const editBillObjsPromises = newBillObjs.map(current => {
      current.status = InvoiceStatus.CREATED

      return this.billObjService.updateOne(current, user.id)
    })

    await Promise.all(editBillObjsPromises)
  }

  async getInvoiceCasesSnapshots (invoice: IGeneratedInvoices) {
    const invoiceId = invoice.type === InvoiceType.CREDIT_NOTE
      ? invoice.originalInvoiceId
      : invoice.invoiceId
    if (invoiceId == null) throw new Error('error_invoice_id_not_found')
    const invoiceCasesSnapshots = await this.invoicesCasesSnapshot.find({
      invoiceId,
    })
    return invoiceCasesSnapshots
  }

  async addInvoiceNumber () {
    try {
      const invoices = await this.generatedInvoiceModel.find({
        invoiceNumber: {
          $exists: false
        }
      })

      const invoicesMap = {}

      if (invoices.length > 0) {
        invoices.forEach(current => {
          invoicesMap[current.invoiceId] = current
        })

        for (const invoice of invoices) {
          const matching = invoicesMap[invoice.originalInvoiceId]

          invoice.invoiceNumber = invoice.invoiceId
          invoice.invoiceId = invoice.id

          if (matching != null) {
            invoice.originalInvoiceId = matching.id
            invoice.originalInvoiceNumber = matching.invoiceNumber
          }

          await this.generatedInvoiceModel.updateOne({
            _id: new ObjectId(invoice.id),
          }, invoice)
        }
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async convertInvoicesLogic (email: string) {
    try {
      const pattern = { role: 'credential', cmd: 'getCredentialsByEmail' }

      const payloadData = {
        email,
      }
      const credentialData: ICredential = await callMSWithTimeoutAndRetry(this.usersClient,
        pattern,
        payloadData,
        Component.BILLING)

      if (!credentialData.isSuperAdmin)
        throw new Error('Unauthorized')

      const posted = await this.generatedInvoiceModel.updateMany({
        status: {
          $in: ['POSTED']
        }
      }, {
        status: InvoiceStatus.EMITTED,
        posted: true,
        paid: true
      })

      const postedCancelled = await this.generatedInvoiceModel.updateMany({
        status: {
          $in: ['POSTED_CANCELLED']
        }
      }, {
        status: InvoiceStatus.CANCELLED,
        posted: true,
      })

      const paid = await this.generatedInvoiceModel.updateMany({
        status: {
          $in: ['PAID']
        }
      }, {
        status: InvoiceStatus.EMITTED,
        posted: false,
        paid: true
      })

      // eslint-disable-next-line no-console
      console.log('Updated invoices')
      // eslint-disable-next-line no-console
      console.log('POSTED', posted.modifiedCount)
      // eslint-disable-next-line no-console
      console.log('POSTED CANCELLED', postedCancelled.modifiedCount)
      // eslint-disable-next-line no-console
      console.log('PAID', paid.modifiedCount)

      return 'done'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async countAllExportables (exportType: BillsListCSVExport) {
    try {
      const filters: FilterQuery<GeneratedInvoice> = {
        status: {
          $in: exportableInvoicesStatuses
        }
      }

      switch (exportType) {
        case BillsListCSVExport.INVOICES:
          filters.posted = false
          break

        case BillsListCSVExport.RECIPIENT:
          filters.posted = true
          break

        default:
          throw new Error('Unsupported')
      }

      const exportableInvoices = await this.generatedInvoiceModel.find(filters)

      return exportableInvoices.length
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async addPostedFlagWhereMissing (email: string) {
    try {
      const pattern = { role: 'credential', cmd: 'getCredentialsByEmail' }

      const payloadData = {
        email,
      }
      const credentialData: ICredential = await callMSWithTimeoutAndRetry(this.usersClient,
        pattern,
        payloadData,
        Component.BILLING)

      if (!credentialData.isSuperAdmin)
        throw new Error('Unauthorized')

      const invoicesWithoutFlag = await this.generatedInvoiceModel.updateMany({
        posted: {
          $exists: false
        }
      }, {
        posted: false,
      })

      const resultString = `Added posted flag (false) to ${invoicesWithoutFlag.modifiedCount} invoices`

      return resultString
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findExportableForPDFArchives (
    query:string,
    userPermissions: UserPermissions,
    datePattern: string,
    fromTimestamp: number,
    toTimestamp: number,
    invoiceTypes: InvoiceType[]
  ) {
    try {
      const { invoices } = await this.fullTextSearchInvoicesWithTotal(
        query,
        0,
        Infinity,
        userPermissions,
        null,
        null,
        datePattern,
        Infinity,
        fromTimestamp,
        toTimestamp,
        undefined,
        undefined,
        invoiceTypes,
        true
      )

      return invoices
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
