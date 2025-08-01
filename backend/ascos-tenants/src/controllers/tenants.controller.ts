import { parseErrorMessage, CreateTenantDTO, ExportTenantDTO, ResetTenantDTO } from '@smambu/lib.constantsjs'
import {
  Body,
  Controller,
  HttpException,
  Post,
  Req,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import { TenantService } from 'src/services/tenant.service'
import { CreateTenantBodyValidator } from 'src/pipes/CreateTenantBodyValidator'
import { MessagePattern } from '@nestjs/microservices'
import { AllExceptionsFilter, MPInterceptor } from '@smambu/lib.commons-be'

@Controller('tenants')
export class TenantsController {
  constructor (private readonly tenantService: TenantService) { }

  @Post('reset')
  @UseFilters(AllExceptionsFilter)
  async resetTenant (
    @Body() data: ResetTenantDTO,
    // get request
    @Req() { email }: { email: string }
  ) {
    try {
      global.als.enterWith({ bypassTenant: true })

      const res = await this.tenantService.resetTenant(data, email)
      return res
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('normalize/debtorNumbers')
  @UseFilters(AllExceptionsFilter)
  async normalizeDebtorNumbers (
    @Body() body: { limit: number, tenantId: string },
  ) {
    try {
      if (body.tenantId == null) throw new Error('Tenant ID is required')

      const als = global.als
      const store = { tenantId: body.tenantId }
      als.enterWith(store)

      return this.tenantService.normalizeDebtorNumbers(body)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('normalize/patientsNumbers')
  @UseFilters(AllExceptionsFilter)
  async normalizePatientsNumbers (
    @Body() body: {
      limit: number,
      tenantId: string,
      skipPatients?: boolean,
      skipCases?: boolean,
      sleepTime?: number
    },
  ) {
    try {
      if (body.tenantId == null) throw new Error('Tenant ID is required')

      const als = global.als
      const store = { tenantId: body.tenantId }
      als.enterWith(store)

      return this.tenantService.normalizePatientsNumbers(body)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/createAuditTrailAtlasSearchIndex')
  async createAuditTrailAtlasSearchIndex () {
    return this.tenantService.createAuditTrailAtlasSearchIndex()
  }

  @Post('export')
  @UseFilters(AllExceptionsFilter)
  async exportTenant (
    @Body() data: ExportTenantDTO
  ) {
    try {
      global.als.enterWith({ tenantId: data.tenantId })

      const res = await this.tenantService.exportTenant(data)
      return res
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async create (
    @Req() request: any,
    @Body(new CreateTenantBodyValidator()) data: CreateTenantDTO,
  ) {
    try {
      (global as any).als.enterWith({ bypassTenant: true })

      const res = await this.tenantService.create(data, request.email)
      return res
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'tenants', cmd: 'getTenantsByIds' })
  async getTenantsByIds ({ tenantsIds }: { tenantsIds: string[] }) {
    try {
      const tenants = await this.tenantService.getTenantsByIds(tenantsIds)
      return tenants
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'tenants', cmd: 'getTenantById' })
  async getTenantById (data: { id: string }) {
    try {
      const tenant = await this.tenantService.getTenantById(data.id)
      return tenant
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
