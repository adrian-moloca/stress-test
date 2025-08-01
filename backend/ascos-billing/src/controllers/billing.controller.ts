import { AllExceptionsFilter, BypassTenantInterceptor, EnvConfigsService, MPInterceptor, exportData, LoggingInterceptor } from '@smambu/lib.commons-be'
import {
  Case,
  ICancelPayloadItem,
  ICaseBilling, ICreateBillDTO, IExtraCustomCosts, IExtraMaterial, IGeneratedInvoices, IUser,
  PermissionsDec, UserPermissions,
  autoGuessCaseCategory,
  backendConfiguration,
  booleanPermission,
  checkPermission,
  genericPermissionError,
  getNeededInvoices,
  parseErrorMessage,
  permissionRequests,
  servicePermissions,
} from '@smambu/lib.constantsjs'
import {
  Controller,
  Get,
  Post,
  Body,
  UseFilters,
  Param,
  HttpException,
  Req,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { ParseCancelBillsRequest, ParseCreateBill, ParseExternalCases, ParseExtraCustomCosts, ParseExtraMaterials } from 'src/pipes'
import { BillsObjDocument } from 'src/schemas/billsObj.schema'
import { BillingService, BillobjService, GeneratedInvoiceService, SammelCheckpointService } from 'src/services'
import { SnapshotService } from 'src/services/snapshot.service'

@UseInterceptors(LoggingInterceptor)
@Controller('bills')
export class BillingController {
  constructor (
    private readonly billingService: BillingService,
    private readonly billObjService: BillobjService,
    private readonly snapshotService: SnapshotService,
    private readonly generatedInvoiceService: GeneratedInvoiceService,
    private readonly sammelcheckpointService: SammelCheckpointService,
    private readonly envConfigsService: EnvConfigsService,
  ) { }

  @Get(':billId')
  @UseFilters(AllExceptionsFilter)
  async getTargetBill (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('billId') billId: string,
  ) {
    try {
      checkPermission(permissionRequests.canViewBill, { userPermissions })
      return await this.billingService.getOne(billId, userPermissions)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':caseId/auto-category')
  @UseFilters(AllExceptionsFilter)
  async getCaseCategory (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('caseId') caseId: string,
    @Req() request: any,
  ) {
    try {
      const serviceUserPermission = servicePermissions as unknown as UserPermissions
      const caseItem = await this.billingService
        .getCaseById(caseId, request.user, serviceUserPermission)
      checkPermission(permissionRequests.canViewCase, { userPermissions, props: { caseItem } })
      const contract = await this.billingService.getContractById(
        caseItem.bookingSection.contractId,
        request.user,
        serviceUserPermission
      )

      const translator = await this.envConfigsService.getTranslator()

      return autoGuessCaseCategory(translator, caseItem, contract)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':caseId/caseMaterialsPrices')
  @UseFilters(AllExceptionsFilter)
  async getCaseMaterialPrices (
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any,
  ) {
    try {
      const canViewMaterialsDatabase = booleanPermission(
        permissionRequests.canViewMaterialsDatabase,
        { userPermissions }
      )
      const canViewMaterialsDatabaseNames = booleanPermission(
        permissionRequests.canViewMaterialsDatabaseNames,
        { userPermissions }
      )

      if (!canViewMaterialsDatabase && !canViewMaterialsDatabaseNames)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

      const caseMaterials = await this.billingService
        .getCaseMaterialPrices(caseId, request.user, userPermissions)

      return caseMaterials
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':caseId/missing-data')
  @UseFilters(AllExceptionsFilter)
  async getMissingData (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('caseId') caseId: string,
    @Req() request: any,
  ) {
    try {
      const caseItem = await this.billingService.getCaseById(caseId, request.user, userPermissions)
      checkPermission(permissionRequests.canViewCase, { userPermissions, props: { caseItem } })

      const billingDocument = await this.billingService.findByCaseId(caseId)
      const parsedBillingDocument = await this.billObjService
        .populateBillingDocumentWithBillingObjects(billingDocument)

      const missingData = []

      parsedBillingDocument.bills.forEach(bill => missingData.push(...bill.missingData))

      return missingData
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  async updateBillingDocument (data: ICaseBilling, user: IUser, userPermissions: UserPermissions) {
    const translator = await this.envConfigsService.getTranslator()
    const { caseBillSnapshot, caseBillProps } = await this.billingService
      .getDataForSnapshot(data.caseId, user, userPermissions)

    const billingDocument = await this.billingService.findByCaseId(data.caseId)

    if (!billingDocument) {
      const errorLabel = translator.fromLabel('bill_not_found', { caseId: data.caseId })

      throw new Error(errorLabel)
    }

    // delete all billObjs
    await this.billObjService.deleteMany(billingDocument.bills)
    billingDocument.bills = []

    const snapshot = await this.snapshotService
      .updateByCaseId(caseBillSnapshot, data.caseId, user.id)

    const neededInvoiceTypes = getNeededInvoices(caseBillSnapshot.case)

    const billObjs = await this.billObjService
      .createNeededWithTypes(snapshot.toObject(), user.id, neededInvoiceTypes)

    billObjs.forEach(billObj => billingDocument.bills.push(billObj.id))
    billingDocument.snapshot = snapshot.id
    for (const key in caseBillProps)
      billingDocument[key] = caseBillProps[key]

    await this.billingService.updateBillingDocument(billingDocument)
    return billingDocument
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'deleteByCaseId' })
  async mpDeleteByCaseId ({ caseId }: { caseId: string }) {
    try {
      await this.snapshotService.deleteByCaseId(caseId)
      await this.billObjService.deleteByCaseId(caseId)
      await this.billingService.deleteByCaseId(caseId)
      await this.generatedInvoiceService.deleteByCaseId(caseId)
      return true
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Get(':caseId/get-billing-document')
  @UseFilters(AllExceptionsFilter)
  async getBillingDocument (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('caseId') caseId: string,
  ) {
    try {
      checkPermission(permissionRequests.canViewBills, { userPermissions })
      const billingDocument = await this.billingService.findByCaseId(caseId)
      if (!billingDocument) throw new HttpException('bill_not_found', 404)

      const caseItem = await this.billingService
        .getCaseById(billingDocument.caseId, null, userPermissions)
      checkPermission(permissionRequests.canViewBill, { userPermissions, props: { caseItem } })

      const parsedBillingDocument = await this.billObjService
        .populateBillingDocumentWithBillingObjects(billingDocument)
      return parsedBillingDocument
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/set-billed-externally')
  @UseFilters(AllExceptionsFilter)
  async setBilledExternally (
    @PermissionsDec() userPermissions: UserPermissions,
    @Body(new ParseExternalCases()) caseIds: string[],
    @Req() request: any,
  ) {
    try {
      checkPermission(permissionRequests.canEditCases, { userPermissions })

      return await this.billingService
        .setCasesBilledExternally(caseIds, request.user, userPermissions)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post(':invoiceId/update-extra-materials')
  @UseFilters(AllExceptionsFilter)
  async updateExtraMaterials (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('invoiceId') invoiceId: string,
    @Body(new ParseExtraMaterials()) data: IExtraMaterial[],
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canEditCases, { userPermissions })
      return await this.billObjService.updateExtraMaterials(
        invoiceId,
        req.user.id,
        data
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post(':invoiceId/update-extra-custom-costs')
  @UseFilters(AllExceptionsFilter)
  async updateExtraCustomCosts (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('invoiceId') invoiceId: string,
    @Body(new ParseExtraCustomCosts()) data: IExtraCustomCosts[],
    @Req() request: any
  ) {
    try {
      checkPermission(permissionRequests.canEditCases, { userPermissions })
      return await this.billObjService.updateExtraCustomCosts(
        invoiceId,
        request.user.id,
        data
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':caseId/get-needed-invoice-types')
  @UseFilters(AllExceptionsFilter)
  async getNeededInvoiceTypes (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('caseId') caseId: string,
    @Req() request: any,
  ) {
    try {
      const caseObj = await this.billingService.getCaseById(caseId, request.user, userPermissions)

      return getNeededInvoices(caseObj)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  // TODO: this is probably not used anywhere, so check and delete
  @Post('/new')
  @UseFilters(AllExceptionsFilter)
  async create (
    @PermissionsDec() userPermissions: UserPermissions,
    @Body(new ParseCreateBill()) data: ICaseBilling,
    @Req() request: any,
  ) {
    try {
      const caseItem = await this.billingService
        .getCaseById(data.caseId, request.user, userPermissions)
      checkPermission(permissionRequests.canEditCase, { userPermissions, props: { caseItem } })

      return await this.billingService
        .createNewOrUpdateBillingDocument(data, request.user, userPermissions)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/generate-bills')
  @UseFilters(AllExceptionsFilter)
  async generateBills (
    @Body() data: {
      payload: IGeneratedInvoices[]
    },
    @Req() request: any,
  ) {
    try {
      const casesIds = data.payload.reduce((acc, current) => acc.concat(current.casesRef), [])
      const casesValid = await this.generatedInvoiceService.checkCasesInvoicesValidity(casesIds)
      if (!casesValid) throw new HttpException('create_invoice_error_case_incomplete', 400)

      const result = await Promise.all(
        data.payload
          .map(current => this.generatedInvoiceService.createIfNotExists(current, request.user))
      )
      return result
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/cancel-bills')
  @UseFilters(AllExceptionsFilter)
  async cancelBills (
    @Body(new ParseCancelBillsRequest()) data: ICancelPayloadItem[],
    @Req() request: any,
  ) {
    try {
      const casesIds = data.reduce((acc, current) => acc.concat(current.cases), [] as string[])
      const casesValid = await this.generatedInvoiceService.checkCasesInvoicesValidity(casesIds)
      if (!casesValid) throw new HttpException('create_invoice_error_case_incomplete', 400)

      const res = await this.generatedInvoiceService.cancelBills(data, request.user)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'getCaseCategory' })
  async mpGetCaseCategory ({
    caseId,
    user,
    userPermissions,
    permissionCheck = false,
  }: {
    caseId: string
    user: IUser
    userPermissions: UserPermissions
    permissionCheck: boolean
  }) {
    try {
      const caseObj = await this.billingService
        .getCaseById(caseId, user, userPermissions, permissionCheck)
      const contract = await this.billingService.getContractById(
        caseObj.bookingSection.contractId,
        user,
        userPermissions,
        permissionCheck,
      )

      const translator = await this.envConfigsService.getTranslator()

      return autoGuessCaseCategory(translator, caseObj, contract)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'updateExtraMaterials' })
  async mpUpdateExtraMaterials ({
    invoiceId,
    data,
    user,
  }: {
    invoiceId: string
    data: IExtraMaterial[]
    user: IUser
  }) {
    try {
      return await this.billObjService.updateExtraMaterials(
        invoiceId,
        user.id,
        data
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'updateExtraCustomCosts' })
  async mpUpdateExtraCustomCosts ({
    invoiceId,
    data,
    user,
  }: {
    invoiceId: string
    data: IExtraCustomCosts[]
    user: IUser
  }) {
    try {
      return await this.billObjService.updateExtraCustomCosts(
        invoiceId,
        user.id,
        data
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'getMultipleBillingDocuments' })
  async mpGetMultipleBillingDocuments (
    {
      casesIds
    }:
    {
      casesIds: string[]
    }
  ) {
    try {
      const billingDocuments = await this.billingService.findMultipleByCaseId(casesIds)

      if (!billingDocuments.length) throw new HttpException('bill_not_found', 404)

      const parsedBillingDocuments = await Promise
        .all(billingDocuments.map(async billingDocument => {
          const parsedBill = await this.billObjService
            .populateBillingDocumentWithBillingObjects(billingDocument)

          return parsedBill
        }))

      return parsedBillingDocuments
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'createNewOrUpdate' })
  async mpCreateNew (
    {
      createBillObj,
      user,
      userPermissions,
      caseObj,
    }: {
      createBillObj: ICreateBillDTO,
      user: IUser,
      userPermissions: UserPermissions
      caseObj: Case
    }
  ) {
    try {
      const parser = new ParseCreateBill()
      const data = parser.transform(createBillObj)

      const res = await this.billingService
        .createNewOrUpdateBillingDocument(data, user, userPermissions, caseObj)

      return res
    } catch (error) {
      console.error('createNewOrUpdate error', error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'updateBillingDocument' })
  async mpUpdateBillingDocument (
    {
      createBillObj,
      user,
      userPermissions
    }: {
      createBillObj: ICreateBillDTO,
      user: IUser,
      userPermissions: UserPermissions
    }
  ) {
    try {
      const parser = new ParseCreateBill()
      const data = parser.transform(createBillObj)

      return await this.updateBillingDocument(data, user, userPermissions)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'getBillSnapshot' })
  async getBillSnapshot ({ caseId }: {caseId: string}) {
    try {
      return await this.snapshotService.findByCaseId(caseId)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'updateBillSnapshot' })
  async updateBillSnapshot ({
    caseObj,
    user,
    userPermissions,
    noAuditTrail = false,
    recomputeBillObjs = false
  }:
  {
    caseObj: Case,
    user: IUser | null,
    userPermissions: UserPermissions
    noAuditTrail?: boolean
    recomputeBillObjs?: boolean
  }) {
    try {
      const caseId = caseObj.caseId
      const { caseBillSnapshot, caseBillProps } = await this.billingService
        .getDataForSnapshot(caseId, user, userPermissions, caseObj)

      const billingDocument = await this.billingService.findByCaseId(caseId)

      for (const key in caseBillProps)
        billingDocument[key] = caseBillProps[key]

      const updateBillingDocument = await this.billingService.updateBillingDocument(billingDocument)

      const parsedBillingDocument = await this.billObjService
        .populateBillingDocumentWithBillingObjects(updateBillingDocument)

      if (recomputeBillObjs) {
        const neededInvoiceTypes = getNeededInvoices(caseBillSnapshot.case)
        const currentInvoiceTypes = parsedBillingDocument.bills.map(bill => bill.type)

        const invoicesToDelete = currentInvoiceTypes
          .filter(current => !neededInvoiceTypes.includes(current))
        const invoicesToCreate = neededInvoiceTypes
          .filter(current => !currentInvoiceTypes.includes(current))

        if (invoicesToDelete.length > 0) {
          const billObjsToDelete = parsedBillingDocument.bills
            .filter(current => invoicesToDelete.includes(current.type))
            .map(current => {
              const parsed = current as BillsObjDocument

              return parsed._id.toHexString()
            })
          await this.billObjService.deleteMany(billObjsToDelete)

          updateBillingDocument.bills = updateBillingDocument.bills
            .filter(bill => !billObjsToDelete.includes(bill))
        }

        if (invoicesToCreate.length > 0) {
          const billObjsToCreate = await this.billObjService
            .createNeededWithTypes(caseBillSnapshot, user?.id, neededInvoiceTypes, noAuditTrail)

          billObjsToCreate
            .filter(current => invoicesToCreate.includes(current.type))
            .forEach(current => updateBillingDocument.bills.push(current.id))
        }

        await this.billingService.updateBillingDocument(updateBillingDocument)
      }

      await this.billObjService.updateManyFromSnapshot(caseBillSnapshot,
        user?.id,
        parsedBillingDocument.bills,
        noAuditTrail)

      return await this.snapshotService
        .updateByCaseId(caseBillSnapshot, caseId, user?.id, noAuditTrail)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_billing)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.billingService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bill', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.billingService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
