import { AllExceptionsFilter, EnvConfigsService, LoggingInterceptor } from '@smambu/lib.commons-be'
import {
  ArchiveAllEligiblesDTO,
  IGetPDFArchivesDTO,
  InvoicePDFArchiveStatus,
  PermissionsDec, UserPermissions,
  checkPermission,
  parseErrorMessage,
  permissionRequests,
  tAllEligiblesExportData,
  tInvoicesPdfsArchive,
} from '@smambu/lib.constantsjs'
import {
  Controller,
  UseFilters,
  HttpException,
  Post,
  Body,
  UseInterceptors,
  Req,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { PdfArchiveService } from 'src/services'

@UseInterceptors(LoggingInterceptor)
@Controller('pdfarchives')
export class PdfArchiveController {
  constructor (
    private readonly pdfArchiveService: PdfArchiveService,
    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,
  ) { }

  @Post('/generate-archive')
  @UseFilters(AllExceptionsFilter)
  async generateArchive (
    @Req() request: any,
    @Body() data: {
      payload: string[]
    },
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canDownloadBills, { userPermissions })
      const user = request.user
      const store = global.als.getStore()
      const tenantId = store.tenantId

      const invoicesId = data.payload

      const invoicesData = await this.pdfArchiveService.getDataForArchive(invoicesId)

      const casesIds = new Set<string>()
      const pdfFileNames:string[] = []

      invoicesData.forEach(current => {
        pdfFileNames.push(current.pdfRef)
        current.casesRef.forEach(caseRef => {
          casesIds.add(caseRef)
        })
      })

      const caseIdsArray = [...casesIds]

      const { canAccessAllCases, firstForbiddenCaseId } = await this.pdfArchiveService
        .checkAccessToCases(caseIdsArray, user, userPermissions)

      if (!canAccessAllCases) {
        const translator = await this.envConfigClient.getTranslator()

        if (!translator)
          throw new Error('Translator not found')

        const message = translator.fromLabel('userNotAllowedTargetBill', {
          userId: user.id,
          firstForbiddenCaseId
        })

        console.error(message)
        throw new HttpException(message, HttpStatus.FORBIDDEN)
      }

      const archiveData:tInvoicesPdfsArchive = {
        invoicesIds: invoicesId,
        status: InvoicePDFArchiveStatus.REQUESTED,
        creatorId: user.id,
        tenantId
      }

      const res = this.pdfArchiveService.requestArchiveGeneration(archiveData,
        pdfFileNames,
        user.id,
        tenantId)

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

  @Post('/generate-all-eligibles-archive')
  @UseFilters(AllExceptionsFilter)
  async generateAllEligiblesArchive (
    @Req() request: any,
    @Body() data: ArchiveAllEligiblesDTO,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canDownloadBills, { userPermissions })
      const user = request.user
      const store = global.als.getStore()
      const tenantId = store.tenantId

      const {
        datePattern,
        fromTimestamp,
        toTimestamp,
        query,
        invoiceTypes
      } = data

      const allEligiblesExportData:tAllEligiblesExportData = await this.pdfArchiveService
        .getAllEligiblesFiles(
          query,
          userPermissions,
          datePattern,
          fromTimestamp,
          toTimestamp,
          invoiceTypes
        )

      const { invoicesId, filenames } = allEligiblesExportData

      if (invoicesId.length === 0 || filenames.length === 0) {
        const translator = await this.envConfigClient.getTranslator()

        if (!translator)
          throw new Error('Translator not found')

        const errorMessage = translator.fromLabel('noEligibleInvoicesForArchive')
        throw new Error(errorMessage)
      }

      const archiveData:tInvoicesPdfsArchive = {
        invoicesIds: invoicesId,
        status: InvoicePDFArchiveStatus.REQUESTED,
        creatorId: user.id,
        tenantId
      }

      const res = this.pdfArchiveService.requestArchiveGeneration(archiveData,
        filenames,
        user.id,
        tenantId)

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

  @Post('/getPdfArchives')
  @UseFilters(AllExceptionsFilter)
  async getPdfArchives (
    @Req() request: any,
    @Body() query: IGetPDFArchivesDTO,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canDownloadBills, { userPermissions })

      const { page, pageSize } = query

      const user = request.user

      const pdfArchives = await this.pdfArchiveService.getPdfArchives(page, pageSize, user.id)

      return pdfArchives
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
