import { Body, Controller, Get, Headers, HttpException, HttpStatus, Inject, Param, Post, UseFilters } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { AllExceptionsFilter, BodyToAsyncLocalStorageDecorator, parseProxyUpdatePayload } from '@smambu/lib.commons-be'
import { callMSWithTimeoutAndRetry, Component, genericPermissionError, parseErrorMessage, PermissionsDec, PROXY_PERMISSIONS, tProxyListRequest, tUpdateProxyPayload, UserPermissions } from '@smambu/lib.constantsjs'
import { ProxyService } from 'src/services'

@Controller()
export class ProxyController {
  constructor (
    @Inject(ProxyService)
    private readonly proxyService: ProxyService,
    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,
  ) {}

  @Post('/proxies')
  @UseFilters(AllExceptionsFilter)
  async getProxiesList (
    @Headers() headers: Record<string, string>,
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() body: tProxyListRequest,
  ) {
    try {
      const { page, pageSize, domainId } = body

      const pattern = { role: 'environmentConfig', cmd: 'getLanguage' }

      const language = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        {},
        Component.PROXY_CONTROLLER)

      const hasPermission = await this.proxyService.checkProxyPermission(
        domainId,
        PROXY_PERMISSIONS.CAN_ACCESS_PROXIES,
        userPermissions,
        language,
        headers.authorization
      )

      if (!hasPermission)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

      const proxies = await this.proxyService.getProxiesPaginatedList(page, pageSize)

      return proxies
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/proxies/:domainId/:contextKey')
  @UseFilters(AllExceptionsFilter)
  async getProxyByContextKey (
    @Headers() headers: Record<string, string>,
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('domainId') domainId: string,
    @Param('contextKey') contextKey: string,
  ) {
    try {
      const pattern = { role: 'environmentConfig', cmd: 'getLanguage' }

      const language = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        {},
        Component.PROXY_CONTROLLER)

      const hasPermission = await this.proxyService.checkProxyPermission(
        domainId,
        PROXY_PERMISSIONS.CAN_ACCESS_PROXY_DETAILS,
        userPermissions,
        language,
        headers.authorization
      )

      if (!hasPermission)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

      const proxy = await this.proxyService.getProxyByContextKey(contextKey)

      return proxy
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/update-proxy')
  @UseFilters(AllExceptionsFilter)
  @BodyToAsyncLocalStorageDecorator()
  async updateTargetProxy (
    @Headers() headers: Record<string, string>,
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() body: tUpdateProxyPayload,
  ) {
    try {
      const { contextKey, domainId } = body.proxy

      const pattern = { role: 'environmentConfig', cmd: 'getLanguage' }

      const language = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        {},
        Component.PROXY_CONTROLLER)

      const hasPermission = await this.proxyService.checkProxyPermission(
        domainId,
        PROXY_PERMISSIONS.CAN_EDIT_PROXY,
        userPermissions,
        language,
        headers.authorization
      )

      if (!hasPermission)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

      const { updatedFieldsValues, fragments } = parseProxyUpdatePayload(body)

      const hasChanges = Object.keys(updatedFieldsValues).length > 0

      // TODO: ref #1369
      if (hasChanges)
        await this.proxyService.updateProxy(
          domainId,
          contextKey,
          updatedFieldsValues,
          fragments
        )

      return true
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
