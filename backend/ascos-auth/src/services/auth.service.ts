import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common'
import {
  Component,
  ICredential,
  IUser,
  LoginRequestDto,
  LoginResponseDto,
  LoginToTenantRequestDto,
  LoginToTenantResponseDto,
  ResetPasswordRequestDto,
  SendVerificationEmailRequestDto,
  UserPermissions,
  callMSWithTimeoutAndRetry,
} from '@smambu/lib.constantsjs'
import { JwtService } from '@nestjs/jwt'
import { ClientProxy } from '@nestjs/microservices'
import * as bcrypt from 'bcryptjs'
import { LoggingService, SendgridService } from '@smambu/lib.commons-be'

@Injectable()
export class AuthService {
  constructor (
    @Inject('USERS_CLIENT') private readonly client: ClientProxy,
    @Inject('ROLE_CLIENT') private readonly roleClient: ClientProxy,
    @Inject('USERS_CLIENT') private readonly usersClient: ClientProxy,
    @Inject('TENANTS_CLIENT') private readonly tenantsClient: ClientProxy,
    private jwtService: JwtService,
    private sendgridService: SendgridService,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.AUTH)
  }

  verifyTokenSafe (token) {
    try {
      // XXX TODO: maybe we can type this function with a generic, passing in the
      // shape of the token we are expecting. This way we end up with something
      // better than "any"
      const payload = this.jwtService.verify(token)

      if (payload == null)
        throw new Error('error_invalidToken')

      return payload
    } catch (_e) {
      throw new Error('error_cannotVerifyToken')
    }
  }

  async login (
    data: LoginRequestDto,
  ): Promise<LoginResponseDto | LoginToTenantResponseDto | HttpException> {
    try {
      const { email, password } = data

      const credential = await this.getCredentialByEmail(email)

      if (!credential)
        throw new HttpException('error_userNotExist', 400)

      const isMatched = await bcrypt.compare(password, credential.password)

      if (!isMatched)
        throw new HttpException('error_emailOrPasswordNotCorrect', 400)

      if (!credential.verified)
        throw new HttpException('error_userNotVerified', 400)

      const users = await this.getUsersByEmail(credential.email)
      const tenants = await this.getUserTenants(users)

      if (users.length === 1 && !credential.isSuperAdmin)
        return this.loginToTenant({ email: credential.email, tenantId: tenants[0]._id })

      const tokenWithoutTenant = this.jwtService.sign(
        {
          email: credential.email,
          credentialId: credential.id,
        },
      )

      return {
        email: credential.email,
        users,
        tenants,
        tokenWithoutTenant,
        isSuperAdmin: credential.isSuperAdmin,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async loginToTenant (
    data: LoginToTenantRequestDto,
  ): Promise<LoginToTenantResponseDto | HttpException> {
    try {
      const { email, tenantId } = data

      const user = await this.getUserByEmailAndTenantId(email, tenantId)
      if (!user)
        throw new HttpException('error_userNotExist', 400)

      if (!user.active)
        throw new HttpException('error_userNotActive', 400)

      await this.loggingService.logInfo('User is logged in.', true)

      const tokenWithTenant = this.jwtService.sign(
        {
          email,
          sub: user.id,
          tenantId,
        },
      )

      const tenant = await this.getTenantById(tenantId)
      return {
        email: user.email,
        user,
        tokenWithTenant,
        tenant,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
      return e
    }
  }

  async logout () {
    try {
      await this.loggingService.logInfo('User is logged out.', true)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async validateTokenWithoutTenant (data: { authorization: string }): Promise<true> {
    const jwt = data.authorization?.replace('Bearer ', '')

    if (!jwt)
      throw new Error('error_noAuthorizationHeader')

    const payload = this.verifyTokenSafe(jwt)

    if (!payload?.email)
      throw new Error('error_invalidToken')

    return payload
  }

  async validateToken (data: { authorization: string }):
  Promise<{ user: IUser,
    permissions: UserPermissions,
    tenantId: string }> {
    const jwt = data.authorization?.replace('Bearer ', '')
    if (!jwt)
      throw new Error('error_noAuthorizationHeader')

    const payload = this.verifyTokenSafe(jwt)

    if (!payload.sub || payload.email == null)
      throw new Error('error_invalidToken')

    // XXX This checks whether the tenantid field EXISTS, not that there is a valid
    // tenant with that id.
    if (!payload.tenantId)
      throw new Error('error_invalidTenantId')

    const userDetailPattern = { role: 'user', cmd: 'getUserDetail' }

    const userDetailPayload = { id: payload.sub, tenantId: payload.tenantId }
    const user = await callMSWithTimeoutAndRetry(this.usersClient,
      userDetailPattern,
      userDetailPayload,
      Component.AUTH)

    if (user == null)
      throw new Error('error_invalidToken')

    if (!user.active)
      throw new Error('error_userNotActive')

    const emailWasChanged = user.email !== payload.email

    if (emailWasChanged)
      throw new Error('error_userEmailChanged')

    const permissionsPatten = { role: 'permissions', cmd: 'get' }

    const permissionPayload = { user, tenantId: payload.tenantId }
    const permissions = await callMSWithTimeoutAndRetry(this.roleClient,
      permissionsPatten,
      permissionPayload,
      Component.AUTH)

    return {
      user,
      permissions,
      tenantId: payload.tenantId,
    }
  }

  async resetPassword (
    data: ResetPasswordRequestDto,
  ): Promise<void | HttpException> {
    const { password, token } = data
    try {
      const payload = this.verifyTokenSafe(token)

      if (!payload?.email)
        throw new BadRequestException('error_invalidToken')

      if (Date.now() > payload.exp * 1000)
        throw new BadRequestException('error_tokenExpired')

      const credential = await this.getCredentialByEmail(payload.email)

      if (!credential.pendingResetToken)
        throw new BadRequestException('error_invalidToken')

      const pattern = { role: 'credential', cmd: 'resetPassword' }

      const payloadData = { email: payload.email, password }
      const res = await callMSWithTimeoutAndRetry(this.client,
        pattern,
        payloadData,
        Component.AUTH)

      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async sendVerificationEmail (
    data: SendVerificationEmailRequestDto,
  ): Promise<void | HttpException> {
    try {
      const { email, language } = data
      // TODO review this is the same functionality as in user.service.ts, we could refactor it
      const token = this.jwtService.sign({ email }, {})

      const credential = await this.getCredentialByEmail(email)

      if (credential.verified)
        throw new HttpException('error_userAlreadyVerified', 400)

      const user = await this.getUserByEmail(email)
      if (!user)
        throw new HttpException('error_userNotExist', 400)

      await this.sendgridService.sendVerifyEmail(user, token, language)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUserByEmail (email: string): Promise<IUser | null> {
    const pattern = { role: 'user', cmd: 'getUserByEmail' }

    const payloadData = { email, bypassTenant: true }
    const user = await callMSWithTimeoutAndRetry(this.client,
      pattern,
      payloadData,
      Component.AUTH)

    return user
  }

  async getUsersByEmail (email: string): Promise<IUser[] | null> {
    const pattern = { role: 'user', cmd: 'getUsersByEmailAllTenants' }

    const payloadData = { search: email, bypassTenant: true }
    const user = await callMSWithTimeoutAndRetry(this.client,
      pattern,
      payloadData,
      Component.AUTH)

    return user
  }

  async getUserByEmailAndTenantId (email: string, tenantId: string): Promise<IUser | null> {
    const pattern = { role: 'user', cmd: 'getUserByEmailAndTenantId' }

    const payloadData = { email, tenantId }
    const user = await callMSWithTimeoutAndRetry(this.client,
      pattern,
      payloadData,
      Component.AUTH)

    return user
  }

  async getCredentialByEmail (email: string): Promise<ICredential | null> {
    const pattern = { role: 'credential', cmd: 'getCredentialsByEmail' }

    const payloadData = { email }
    const credential = await callMSWithTimeoutAndRetry(this.client,
      pattern,
      payloadData,
      Component.AUTH)

    return credential
  }

  async forgotPassword (data: { email: string, language: string }): Promise<void | HttpException> {
    try {
      const { email, language } = data

      const token = this.jwtService.sign({ email }, { expiresIn: '10m' })

      const credential = await this.getCredentialByEmail(email)

      if (credential == null)
        throw new HttpException('error_credentialNotExists', 400)

      const users = await this.getUsersByEmail(email)
      const user = users?.[0]

      const pattern = { role: 'credential', cmd: 'setPendingResetToken' }

      const payloadData = { email, token, bypassTenant: true }
      await callMSWithTimeoutAndRetry(this.client,
        pattern,
        payloadData,
        Component.AUTH)

      await this.sendgridService.sendRequestResetPasswordEmail(user, token, email, language)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async verifyEmail (token: string): Promise<string | void | HttpException> {
    try {
      const payload = this.verifyTokenSafe(token)

      const verifyEmailPattern = { role: 'credential', cmd: 'verifyEmail' }

      const verifyEmailPayloadData = { email: payload.email }
      const credential = await callMSWithTimeoutAndRetry(this.client,
        verifyEmailPattern,
        verifyEmailPayloadData,
        Component.AUTH)

      if (!credential.password) {
        const tokenPattern = { role: 'credential', cmd: 'setPendingResetToken' }

        const tokenPayloadData = { email: payload.email, token }
        await callMSWithTimeoutAndRetry(this.client,
          tokenPattern,
          tokenPayloadData,
          Component.AUTH)

        return 'warning_userHasNoPassword'
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUserTenants (users: IUser[]) {
    const tenantsIds = users.map(u => u.tenantId)

    const pattern = { role: 'tenants', cmd: 'getTenantsByIds' }

    const payloadData = { tenantsIds }
    const tenants = await callMSWithTimeoutAndRetry(this.tenantsClient,
      pattern,
      payloadData,
      Component.AUTH)
    return tenants
  }

  async getTenantById (tenantId: string) {
    const pattern = { role: 'tenants', cmd: 'getTenantById' }

    const payloadData = { id: tenantId }
    const tenant = await callMSWithTimeoutAndRetry(this.tenantsClient,
      pattern,
      payloadData,
      Component.AUTH)
    return tenant
  }
}
