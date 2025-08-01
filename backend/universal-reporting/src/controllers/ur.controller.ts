import { Body, Controller, Get, Headers, HttpException, Post, UseFilters, UseInterceptors } from '@nestjs/common'
import { AllExceptionsFilter, MPInterceptor } from '@smambu/lib.commons-be'
import { parseErrorMessage, tExpression, tSupportedLocales, tScope, PermissionsDec, UserPermissions, tExecuteQueryData, tEvaluateNamedExpressionData } from '@smambu/lib.constantsjs'
import { URService } from '../services/ur.service'
import { EvaluateExpressionService } from 'src/services/evaluateExpression.service'
import { MessagePattern } from '@nestjs/microservices'
import { getBillingConfig } from 'src/misc/billing-config-example-generator'

@Controller()
export class AppController {
  constructor (
    private readonly urService: URService,
    private readonly evaluateExpressionService: EvaluateExpressionService,
  ) { }

  // XXX TODO: this needs to be deleted when testing is over
  @Get('testEvaluateExpression')
  @UseFilters(AllExceptionsFilter)
  async test (
    @Headers() headers: Record<string, string>,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      const result = await this.evaluateExpressionService.testEvaluateExpression(
        headers.authorization,
        userPermissions,
      )
      return result
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('executeQuery')
  @UseFilters(AllExceptionsFilter)
  async executeQuery (
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() body: tExecuteQueryData,
  ) {
    try {
      return this.evaluateExpressionService.executeQuery({
        ...body,
        __ignorePermissions: false, // only evaluateNamedExpression can use __ignorePermissions from API
      }, userPermissions)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('evaluateNamedExpression')
  @UseFilters(AllExceptionsFilter)
  async evaluateNamedExpression (
    @Headers() headers: Record<string, string>,
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() body: tEvaluateNamedExpressionData,
  ) {
    try {
      return this.evaluateExpressionService.evaluateNamedExpression(
        body,
        userPermissions,
        headers.authorization,
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  // XXX Warning: this is a test endpoint, and it will be deleted once it is no
  // longer needed
  @Post('evaluateExpression')
  @UseFilters(AllExceptionsFilter)
  async evaluateExpression (
    @Headers() headers: Record<string, string>,
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() {
      data, scope, selectedLocale
    }: {
      data: tExpression, scope: tScope, selectedLocale: tSupportedLocales,
    },
  ) {
    try {
      const parsedUserPermissions = (scope?.userPermissions as UserPermissions) ?? userPermissions

      const result = await this.evaluateExpressionService.evaluateExpression({
        data,
        scope,
        selectedLocale,
        userPermissions: parsedUserPermissions,
        authorization: headers.authorization,
      })
      return result.evaluated
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  // XXX Warning: this is a test endpoint, and it will be deleted once it is no
  // longer needed
  @Post()
  @UseFilters(AllExceptionsFilter)
  async editDynamicData (
    @Body() body: { data: Record<string, unknown>, entityId: string, entityType: string },
  ): Promise<boolean | void> {
    try {
      return this.urService.editDynamicData(body)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  // TODO: This is a test method, delete this when it is not needed
  @Get('getBillingConfig')
  @UseFilters(AllExceptionsFilter)
  async getBillingConfigEndpoint () {
    try {
      const config = getBillingConfig()

      return config
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'UR', cmd: 'evaluateExpression' })
  @UseFilters(AllExceptionsFilter)
  async evaluateExpressionMP (
    @Body() {
      expression,
      scope,
      selectedLocale,
      userPermissions,
    }: {
      expression: tExpression,
      scope: tScope,
      selectedLocale: tSupportedLocales,
      userPermissions: UserPermissions,
    },
  ) {
    try {
      const result = await this.evaluateExpressionService.evaluateExpression({
        data: expression,
        scope,
        selectedLocale,
        userPermissions,
        authorization: '',
      })

      return result.evaluated
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
