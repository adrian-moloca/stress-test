import {
  backendConfiguration,
  checkPermission,
  NumberingSystemTypes,
  parseErrorMessage,
  PermissionsDec,
  systemConfigurationPermissions,
  systemConfigurationSections,
  tExecuteQueryPayload,
  tSystemEnvironmentConfig,
} from '@smambu/lib.constantsjs'
import { Body, Controller, Get, Param, Post, Req, HttpException, UseFilters, UseInterceptors } from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { SystemConfigurationService } from '../services'
import { MPInterceptor, LoggingInterceptor, exportData, AllExceptionsFilter } from '@smambu/lib.commons-be'

// NOTE: the 'app' prefix is necessary because otherwise this controller overlaps with the 'healthz' and I couldn't make the '.exclude' work to avoid authorizing 'healthz'
@UseInterceptors(LoggingInterceptor)
@Controller('app')
export class SystemConfigurationController {
  constructor (private readonly systemConfigurationService: SystemConfigurationService) { }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'systemConfigurations', cmd: 'normalizeDebtorNumbers' })
  async normalizeDebtorNumbers ({
    limit
  }: {
    limit: number,
  }) {
    try {
      return this.systemConfigurationService.normalizeDebtorNumbers(limit)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'systemConfigurations', cmd: 'normalizePatientsNumbers' })
  async normalizePatientsNumbers ({
    limit,
    sleepTime,
  }: {
    limit: number,
    sleepTime?: number,
  }) {
    try {
      return this.systemConfigurationService.normalizePatientsNumbers(limit, sleepTime)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async getSystemConfiguration () {
    try {
      // There is no need to check permissions here, since the every user can read the system configuration
      return this.systemConfigurationService.getSystemConfiguration()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':section')
  @UseFilters(AllExceptionsFilter)
  async getSystemConfigurationService (@Param('section') section: systemConfigurationSections) {
    try {
      return this.systemConfigurationService.getSystemConfigurationSection(section)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post(':section')
  @UseFilters(AllExceptionsFilter)
  editVersion (
    @Param('section') section: systemConfigurationSections,
    @Body() data: any,
    @PermissionsDec() userPermissions,
    @Req() req,
  ) {
    try {
      checkPermission(systemConfigurationPermissions[section], { userPermissions })
      return this.systemConfigurationService.editSystemConfigurationSection(section, data, req.user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'SystemConfigurationSection', cmd: 'get' })
  async getSystemConfigurationServiceMessagePattern ({
    section
  }: {
    section: systemConfigurationSections
  }) {
    try {
      return this.systemConfigurationService.getSystemConfigurationSection(section)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'SystemConfigurationSection', cmd: 'edit' })
  async editVersionMessagePattern ({
    section,
    data,
  }: {
    section: systemConfigurationSections,
    data: any,
  }) {
    try {
      return this.systemConfigurationService.editSystemConfigurationSection(section, data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'countControlItems', cmd: 'get' })
  async getCountControlItems () {
    try {
      return this.systemConfigurationService.getCountControlItems()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  // TODO: create new controller for numbering system
  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'caseNumber', cmd: 'get' })
  async getCaseNumber () {
    try {
      return this.systemConfigurationService.getCaseNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'prescriptionNumber', cmd: 'get' })
  async getPrescriptionNumber () {
    try {
      return this.systemConfigurationService.getPrescriptionNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patientNumber', cmd: 'get' })
  async getPatientNumber () {
    try {
      return this.systemConfigurationService.getPatientNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patientDebtorNumber', cmd: 'get' })
  async getPatientDebtorNumber () {
    try {
      return this.systemConfigurationService.getPatientDebtorNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'userDebtorNumber', cmd: 'get' })
  async getUserDebtorNumber () {
    try {
      return this.systemConfigurationService.getUserDebtorNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'thirdPartyDebtor', cmd: 'get' })
  async getThirdPartyDebtor () {
    try {
      return this.systemConfigurationService.getThirdPartyDebtor()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bgDebtorNumber', cmd: 'get' })
  async getBgDebtorNumber () {
    try {
      return this.systemConfigurationService.getBgDebtorNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'invoiceNumber', cmd: 'get' })
  async getInvoiceNumber ({ type }: {type: NumberingSystemTypes}) {
    try {
      return this.systemConfigurationService.getInvoiceNumber(type)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'receiptNumber', cmd: 'get' })
  async getReceiptNumber () {
    try {
      return this.systemConfigurationService.getReceiptNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'environmentConfig', cmd: 'getLanguage' })
  async getEnvConfigLanguageMP () {
    try {
      return this.systemConfigurationService.getLanguage()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'environmentConfig', cmd: 'getCurrency' })
  async getEnvConfigCurrencyMP () {
    try {
      const response = await this.systemConfigurationService
        .getSystemConfigurationSection(systemConfigurationSections.ENVIRONMENT_CONFIG)

      // @ts-expect-error have i have ever told you how types are a mess?
      const envConfigs = response.data as tSystemEnvironmentConfig

      return envConfigs.currency
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'systemConfigurations', cmd: 'getCapabilitiesList' })
  async getCapabilitiesList () {
    try {
      return this.systemConfigurationService.getCapabilitiesList()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'systemConfigurations', cmd: 'query' })
  async executeQuery (data: tExecuteQueryPayload) {
    try {
      return this.systemConfigurationService.executeQuery(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'systemConfigurations', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_system_configuration)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'systemConfigurations', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.systemConfigurationService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'systemConfigurations', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.systemConfigurationService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
