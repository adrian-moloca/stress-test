import { Body, Controller, Get, HttpException, Inject, Param, Post, Query, UseFilters, UseInterceptors } from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { AllExceptionsFilter, MPInterceptor } from '@smambu/lib.commons-be'
import { parseErrorMessage, tURConfigsData, tURConfigsDocuments, URConfigs, VERSIONS_NAMES } from '@smambu/lib.constantsjs'
import { getBillingConfig } from 'src/misc/billing-config-example-generator'
import { JsonConfigsService } from 'src/services'

@Controller()
export class JsonConfigurationController {
  constructor (
    @Inject(JsonConfigsService)
    private readonly configService: JsonConfigsService
  ) {}

  @Post('/configuration')
  @UseFilters(AllExceptionsFilter)
  async addConfiguration (
    @Body() body: tURConfigsData,
    @Query('tenantId') tenantId: string,
  ): Promise<string> {
    try {
      global.als.enterWith({ tenantId })

      const canUploadNewConfig = await this.configService.canUploadNewConfig()

      if (!canUploadNewConfig)
        throw Error('ur_system_busy_error')

      const event = await this.configService.saveConfig(body)

      return event ? 'OK' : 'KO'
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/configuration/:version')
  @UseFilters(AllExceptionsFilter)
  async getConfiguration (
    @Query('tenantId') tenantId: string,
    @Param('version') version: string,
  ): Promise<tURConfigsDocuments> {
    try {
      global.als.enterWith({ tenantId })

      const config = this.configService.getConfig(version)

      // @ts-expect-error remove this when the whole config is typed better,
      // after it is well-established and tested
      return config
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('uRConfigsLastUpdate')
  @UseFilters(AllExceptionsFilter)
  async getURConfigsLastUpdate () {
    try {
      return this.configService.getURConfigsLastUpdate()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  // TODO: XXX Warning: this is a test endpoint. Delete this when it will be
  // not needed anymore.
  @Get('getExampleBillingConfig')
  @UseFilters(AllExceptionsFilter)
  async getExampleBillingConfig () {
    try {
      const exampleConfig = getBillingConfig()

      return exampleConfig
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('getDynamicData')
  @UseFilters(AllExceptionsFilter)
  async getDynamicData () {
    try {
      const dynamicData = await this.configService
        .getTargetConfig(VERSIONS_NAMES.LATEST, URConfigs.DYNAMIC_DATA)

      return dynamicData
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'ur', cmd: 'getDynamicData' })
  async getDynamicDataMP (
    @Body() { version }: {version?:string}
  ) {
    try {
      let targetVersion = version
      if (version == null || version === '')
        targetVersion = VERSIONS_NAMES.LATEST

      const dynamicData = await this.configService
      // @ts-expect-error ts is wrong, the nullish check is right above
        .getTargetConfig(targetVersion, URConfigs.DYNAMIC_DATA)

      return dynamicData
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
