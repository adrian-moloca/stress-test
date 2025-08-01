import { LoginRequestDto, LoginToTenantRequestDto, parseErrorMessage } from '@smambu/lib.constantsjs'
import { Body, Controller, Post, Query, UseFilters, UseInterceptors } from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { AuthService } from '../services'
import { LoggingInterceptor, MPInterceptor, AllExceptionsFilter } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller()
export class AuthController {
  constructor (private readonly authService: AuthService) { }

  @Post('/auth/login')
  @UseFilters(AllExceptionsFilter)
  login (@Body() body: LoginRequestDto) {
    global.als.enterWith({ bypassTenant: true })

    return this.authService.login(body)
  }

  @Post('/auth/loginToTenant')
  @UseFilters(AllExceptionsFilter)
  loginToTenant (@Body() body: LoginToTenantRequestDto) {
    if (!body.tenantId) throw new Error('Tenant ID is required')

    global.als.enterWith({ tenantId: body.tenantId })

    return this.authService.loginToTenant(body)
  }

  @Post('/auth/logout')
  @UseFilters(AllExceptionsFilter)
  logout () {
    global.als.enterWith({ bypassTenant: true })

    return this.authService.logout()
  }

  @MessagePattern({ role: 'auth', cmd: 'validateTokenWithoutTenant' })
  async validateTokenWithoutTenantMP (data: { authorization: string }) {
    try {
      const res = await this.authService.validateTokenWithoutTenant(data)

      return res
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'auth', cmd: 'validateToken' })
  async validateToken (data: { authorization: string }) {
    try {
      const res = await this.authService.validateToken(data)

      return res
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }

  @Post('/auth/reset-password')
  @UseFilters(AllExceptionsFilter)
  resetPassword (@Body() data) {
    global.als.enterWith({ bypassTenant: true })

    return this.authService.resetPassword(data)
  }

  @Post('/auth/resend-verification-email')
  @UseFilters(AllExceptionsFilter)
  async resendOwnVerificationEmail (@Body() data) {
    global.als.enterWith({ bypassTenant: true })

    return this.authService.sendVerificationEmail(data)
  }

  @Post('/auth/forgot-password')
  @UseFilters(AllExceptionsFilter)
  forgotPassword (@Body() data) {
    global.als.enterWith({ bypassTenant: true })

    return this.authService.forgotPassword(data)
  }

  @Post('/auth/verify-email')
  @UseFilters(AllExceptionsFilter)
  async verifyEmail (@Query('token') token: string) {
    global.als.enterWith({ bypassTenant: true })

    return this.authService.verifyEmail(token)
  }
}
