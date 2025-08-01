import { AllExceptionsFilter, EnvConfigsService, LoggingInterceptor } from '@smambu/lib.commons-be'
import {
  BillsListCSVExport,
  ExportCsvRequestDTO,
  ISammelCheckpoint,
  InvoiceFullTextQueryDto,
  PermissionsDec, UserPermissions,
  checkPermission,
  parseErrorMessage,
  permissionRequests,
} from '@smambu/lib.constantsjs'
import Translator from '@smambu/lib.constantsjs/lib/translator'
import { Parser } from '@json2csv/plainjs'
import {
  number as numberFormatter,
  stringQuoteOnlyIfNecessary as stringQuoteOnlyIfNecessaryFormatter,
} from '@json2csv/formatters'
import {
  Controller,
  Get,
  UseFilters,
  HttpException,
  Post,
  Body,
  Req,
  Param,
  UseInterceptors,
} from '@nestjs/common'
import { ParseExportCsvRequest } from 'src/pipes'
import { GeneratedInvoiceService, SammelCheckpointService, SnapshotService } from 'src/services'

const basicCsvOpts = {
  eol: '\r\n',
  delimiter: ';',
  formatters: {
    number: numberFormatter({ decimals: 2, separator: ',' }),
    string: stringQuoteOnlyIfNecessaryFormatter({ quote: '' }),
  },
}

const invoicesOpts = (translator: Translator) => ({
  fields: [
    {
      label: translator.fromLabel('csvHeader_revenueAccount'),
      value: 'revenueAccount'
    },
    {
      label: translator.fromLabel('csvHeader_debtorNumber'),
      value: 'debtorNumber'
    },
    {
      label: translator.fromLabel('csvHeader_debtorName'),
      value: 'debtorName'
    },
    {
      label: translator.fromLabel('csvHeader_amount'),
      value: 'amount'
    },
    {
      label: translator.fromLabel('csvHeader_monthEnd'),
      value: 'monthEnd'
    },
    {
      label: translator.fromLabel('csvHeader_invoiceNumber'),
      value: 'invoiceNumber'
    },
    {
      label: translator.fromLabel('csvHeader_costCenter'),
      value: 'costCenter'
    },
    {
      label: translator.fromLabel('csvHeader_dueDate'),
      value: 'dueDate'
    },
    {
      label: translator.fromLabel('csvHeader_freeze'),
      value: 'freeze'
    },
  ],
  ...basicCsvOpts,
})

const recipientsOpts = (translator: Translator) => ({
  fields: [
    {
      label: translator.fromLabel('csvHeader_debtorNumber'),
      value: 'debtorNumber'
    },
    {
      label: translator.fromLabel('csvHeader_debtorName'),
      value: 'debtorName'
    },
    {
      label: translator.fromLabel('csvHeader_street'),
      value: 'streetNo'
    },
    {
      label: translator.fromLabel('csvHeader_postalCode'),
      value: 'postalCode'
    },
    {
      label: translator.fromLabel('csvHeader_city'),
      value: 'city'
    },
  ],
  ...basicCsvOpts,
})

@UseInterceptors(LoggingInterceptor)
@Controller('invoices')
export class InvoicesController {
  constructor (
    private readonly generatedInvoiceService: GeneratedInvoiceService,
    private readonly sammelcheckpointService: SammelCheckpointService,
    private readonly snapshotService: SnapshotService,
    private readonly envConfigsService: EnvConfigsService,
  ) { }

  @Post('/full-text')
  @UseFilters(AllExceptionsFilter)
  async fullTextSearchBills (
    @Body() query: InvoiceFullTextQueryDto,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      const defaultPaginationLimit = Number(process.env.VITE_DEFAULT_PAGINATION_LIMIT)

      const fromTimeStamp = query.fromTimestamp && Number(query.fromTimestamp)
      const toTimeStamp = query.toTimestamp && Number(query.toTimestamp)

      checkPermission(permissionRequests.canViewCasesBilling, { userPermissions })
      checkPermission(permissionRequests.canViewBills, { userPermissions })

      const res = await this.generatedInvoiceService.fullTextSearchInvoices(
        query.query,
        query.page ? Number(query.page) : 0,
        query.limit ? Number(query.limit) : defaultPaginationLimit,
        userPermissions,
        query.sortBy,
        query.sortOrder,
        query.datePattern,
        defaultPaginationLimit,
        fromTimeStamp,
        toTimeStamp,
        query.casesIds,
      )

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(
        message,
        error?.status ?? 500,
      )
    }
  }

  @Post('/getInvoicesCSV')
  @UseFilters(AllExceptionsFilter)
  async getInvoicesCSV (
    @Body() query: InvoiceFullTextQueryDto,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      const defaultPaginationLimit = Number(process.env.VITE_DEFAULT_PAGINATION_LIMIT)

      const fromTimeStamp = query.fromTimestamp && Number(query.fromTimestamp)
      const toTimeStamp = query.toTimestamp && Number(query.toTimestamp)

      checkPermission(permissionRequests.canViewCasesBilling, { userPermissions })
      checkPermission(permissionRequests.canViewBills, { userPermissions })

      const res = await this.generatedInvoiceService.fullTextSearchInvoices(
        query.query,
        0,
        // this is a hack to get all the possible cases in the db without the
        // need to rewrite and entire function with just a limit removed
        99999999,
        userPermissions,
        query.sortBy,
        query.sortOrder,
        query.datePattern,
        defaultPaginationLimit,
        fromTimeStamp,
        toTimeStamp,
        query.casesIds,
      )

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(
        message,
        error?.status ?? 500,
      )
    }
  }

  @Post('/export-csv')
  @UseFilters(AllExceptionsFilter)
  async exportAll (
    @Body(new ParseExportCsvRequest()) data: ExportCsvRequestDTO,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      const translator = await this.envConfigsService.getTranslator()

      const fromTimeStamp = data.fromTimestamp && +(data.fromTimestamp)
      const toTimeStamp = data.toTimestamp && +(data.toTimestamp)

      const exportableInvoices = await this.generatedInvoiceService.findExportable(
        data.exportType,
        userPermissions,
        data.datePattern,
        data.selectedIds,
        fromTimeStamp,
        toTimeStamp,
        data.query,
      )

      // this shouldn't ever ever happen, we use it to prevent rogue api calls
      if (exportableInvoices.length === 0) throw new Error('no_exportable_invoices')

      const csvData = await this.generatedInvoiceService
        .getCsvData(exportableInvoices, data.exportType, userPermissions)
      this.generatedInvoiceService.updateExportable(exportableInvoices, data.exportType)

      const opts = data.exportType === BillsListCSVExport.INVOICES
        ? invoicesOpts(translator)
        : recipientsOpts(translator)

      const parser = new Parser(opts)

      const csvText = await parser.parse(csvData)
      return csvText
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(
        message,
        error?.status ?? 500,
      )
    }
  }

  @Post('/setPaid/:invoiceId')
  @UseFilters(AllExceptionsFilter)
  async setInvoicePaid (
    @Param('invoiceId') invoiceId: string,
  ) {
    try {
      // TODO: check / fix permissions

      const result = await this.generatedInvoiceService.setPaid(invoiceId)
      return result
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/getCheckpointData/:caseId')
  @UseFilters(AllExceptionsFilter)
  async getCheckPointData (
    @Param('caseId') caseId: string,
  ) {
    try {
      // TODO: check / fix permissions
      const snapshot = await this.snapshotService.findByCaseId(caseId)
      const doctor = snapshot.contract.associatedDoctor

      const checkpoint = await this.sammelcheckpointService.findLatestBySurgeon(doctor.id)

      if (!checkpoint)
        return <ISammelCheckpoint>{
          doctorId: doctor.id,
          consumptions: [],
          createdAt: new Date()
        }

      return checkpoint
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/setPrescribed/:invoiceId')
  @UseFilters(AllExceptionsFilter)
  async getSammelCategories (
    @Param('invoiceId') invoiceId: string,
  ) {
    try {
      // TODO: check / fix permissions
      return this.generatedInvoiceService.setPrescribed(invoiceId)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/getInvoceIdFromBillObj/:billObjId')
  @UseFilters(AllExceptionsFilter)
  async getInvoceId (
    @Param('billObjId') billObjId: string,
  ) {
    try {
      // TODO: check / fix permissions
      return this.generatedInvoiceService.getInvoceIdFromBillObj(billObjId)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/getInvoceNumberFromBillObj/:billObjId')
  @UseFilters(AllExceptionsFilter)
  async getInvoceNumber (
    @Param('billObjId') billObjId: string,
  ) {
    try {
      // TODO: check / fix permissions
      return this.generatedInvoiceService.getInvoceNumberFromBillObj(billObjId)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/checkEligiblesInvoices')
  @UseFilters(AllExceptionsFilter)
  async checkEligiblesInvoices () {
    try {
      const res = await this.generatedInvoiceService
        .countAllExportables(BillsListCSVExport.INVOICES)

      return res > 0
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/checkEligiblesRecipients')
  @UseFilters(AllExceptionsFilter)
  async checkEligiblesRecipients () {
    try {
      const res = await this.generatedInvoiceService
        .countAllExportables(BillsListCSVExport.RECIPIENT)

      return res > 0
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/normalize/convertInvoicesLogic')
  @UseFilters(AllExceptionsFilter)
  async convertInvoiceslogic (
    @Req() request: any,
  ) {
    try {
      const email = request.user?.email

      if (email === null || email === undefined)
        throw new Error('Bad Request - missing email')

      const res = await this.generatedInvoiceService.convertInvoicesLogic(email)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/normalize/addPostedFlagWhereMissing')
  @UseFilters(AllExceptionsFilter)
  async addPostedFlagWhereMissing (
    @Req() request: any,
  ) {
    try {
      const email = request.user?.email

      if (email === null || email === undefined)
        throw new Error('Bad Request - missing email')

      const als = global.als
      const store = { bypassTenant: true }
      als.enterWith(store)

      const res = await this.generatedInvoiceService.addPostedFlagWhereMissing(email)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
