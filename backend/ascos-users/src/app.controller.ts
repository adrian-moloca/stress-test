import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Req,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { UserService } from './services'
import {
  CreateUserPayload,
  CreateUserValidatorPipe,
  EditUserPayload,
  EditUserValidatorPipe,
} from './pipes'
import { UserDocument } from './schemas/user.schema'
import {
  permissionRequests,
  checkPermission,
  filterByPermission,
  UserDec,
  PermissionsDec,
  UserPermissions,
  booleanPermission,
  IUser,
  serializeUser,
  ICapabilityName,
  Scope_Name,
  Capabilities,
  parseErrorMessage,
  backendConfiguration,
  tExecuteQueryPayload,
} from '@smambu/lib.constantsjs'
import { CredentialService } from './services/credential.service'
import { BypassTenantInterceptor, MPInterceptor, LoggingInterceptor, exportData, AllExceptionsFilter } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller()
export class UsersController {
  constructor (
    private readonly userService: UserService,
    private readonly credentialService: CredentialService,
  ) { }

  @Get('/users/me')
  @UseFilters(AllExceptionsFilter)
  async getCurrentUser (@UserDec() user: UserDocument): Promise<any> {
    try {
      if (!user.active)
        throw new HttpException('error_userNotActive', 400)

      const tenant = await this.userService.getTenantById(user.tenantId)

      return ({
        user: serializeUser(user),
        tenant,
      })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/users')
  @UseFilters(AllExceptionsFilter)
  async searchUsers (
    @PermissionsDec() userPermissions,
    @UserDec() user,
  ) {
    try {
      checkPermission(permissionRequests.canViewUsers, { userPermissions })
      const users = await this.userService.getAll(undefined, true)
      return users.filter(
        u =>
          u._id &&
          filterByPermission(permissionRequests.canViewUser, {
            userPermissions,
            user,
            props: { user: { id: u._id } },
          }),
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/doctors')
  @UseFilters(AllExceptionsFilter)
  async searchDoctors (@PermissionsDec() userPermissions) {
    try {
      checkPermission(permissionRequests.canViewDoctors, { userPermissions })
      const doctors = await this.userService.getAllDoctors({ userPermissions })
      return doctors
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getDoctorAssistants' })
  async getDoctorAssistants ({ doctorId }: { doctorId: string }) {
    try {
      return this.userService.getUsersWithCapability({
        capability: Capabilities.P_CASES_VIEW,
        scope: Scope_Name.OTHER_USER_DATA,
        ownerId: doctorId,
      })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Get('/anesthesiologists')
  @UseFilters(AllExceptionsFilter)
  async searchanesthesiologists (@PermissionsDec() userPermissions) {
    try {
      checkPermission(permissionRequests.canViewAnesthesiologists, { userPermissions })
      const doctors = await this.userService.getAnesthesiologists(userPermissions)
      return doctors
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/users/:id')
  @UseFilters(AllExceptionsFilter)
  async getUserById (
    @Param('id') id: string,
    @PermissionsDec() userPermissions,
    @UserDec() user,
  ) {
    try {
      checkPermission(permissionRequests.canViewUser, {
        userPermissions,
        user,
        props: { user: { id } },
      })
      const res = await this.userService.get(id)
      if (!user) return null
      return serializeUser(res.toJSON())
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/users')
  @UseFilters(AllExceptionsFilter)
  async createUser (
    @Body(new CreateUserValidatorPipe()) data: CreateUserPayload,
    @PermissionsDec() userPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canCreateUser, { userPermissions })

      if (process.env.VITE_APP_ENV === 'ci')
        return this.userService.createTestEnv(data)

      return this.userService.create(data, userPermissions)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/users/:id/request-reset-password')
  @UseFilters(AllExceptionsFilter)
  async requestResetUserPassword (
    @Param('id') id: string,
    @PermissionsDec() userPermissions,
    @UserDec() user,
  ) {
    try {
      checkPermission(permissionRequests.canEditUsers, { userPermissions })
      return this.credentialService.requestResetUserPassword(id, user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put('/users/:id')
  @UseFilters(AllExceptionsFilter)
  async updateUser (
    @Param('id') id: string,
    @Body(new EditUserValidatorPipe()) data: EditUserPayload,
    @PermissionsDec() userPermissions,
    @Req() req,
  ) {
    try {
      checkPermission(permissionRequests.canEditUsers, { userPermissions })

      const targetUser = await this.userService.getUserById(id)
      const originalActiveValue = targetUser.active
      const activeChanged = originalActiveValue !== data.active

      if (activeChanged)
        checkPermission(permissionRequests.canActivateUser, { userPermissions })

      return this.userService.update(id, data, req.user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUsersByEmailAllTenants' })
  getUsersByEmailAllTenants ({ search }: { search: string }) {
    try {
      return this.userService.getAllByEmail({ search })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUserByEmailAndTenantId' })
  getUserByEmailAndTenantId (data: { email: string; tenantId: string }) {
    try {
      return this.userService.getUserByEmailAndTenantId(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Get('/credentials/:email')
  @UseFilters(AllExceptionsFilter)
  async getCredentialData (@Param('email') email: string) {
    try {
      const credentialDatas = await this.credentialService.getCredentialsData([email])

      if (!credentialDatas || credentialDatas.length === 0)
        throw new HttpException('error_credentialNotFound', 404)

      return credentialDatas[0] ?? {}
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/checkEmailAlreadyUsed/:email')
  @UseFilters(AllExceptionsFilter)
  async checkEmailAlreadyUsed (@Param('email') email: string) {
    try {
      const alreadyUsed = await this.userService.checkForDuplicateEmail(email, false)

      return {
        email,
        alreadyUsed,
      }
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'credential', cmd: 'setPendingResetToken' })
  async setPendingResetToken ({
    email,
    token,
  }: {
    email: string;
    token: string;
  }) {
    try {
      await this.credentialService.setPendingResetToken({ email, token })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'credential', cmd: 'resetPassword' })
  async resetUserPassword ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    try {
      return this.credentialService.resetPassword(email, password)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUserByEmail' })
  async getUserByEmail ({ email }: { email: string }) {
    try {
      const user = await this.userService.findByEmail(email)
      if (!user) return null
      return serializeUser(user.toJSON())
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'credential', cmd: 'verifyEmail' })
  async verifyEmail ({ email }: { email: string }) {
    try {
      return this.credentialService.verifyEmail(email)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUserCountByRolesAssociationIds' })
  getUserCountByRolesAssociationIds ({
    rolesAssociationIds,
  }: {
    rolesAssociationIds: string[]
  }) {
    try {
      return this.userService.getUserCountByRolesAssociationIds(
        rolesAssociationIds,
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUserDetail' })
  async getUserDetail ({ id }: { id: string }) {
    try {
      const user = await this.userService.get(id)
      if (user == null) return null
      return serializeUser(user.toJSON())
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getMultipleUsers' })
  getMultipleUsers ({ ids }: { ids: string[] }) {
    try {
      return this.userService.getMultipleUsers(ids)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getMultipleDoctors' })
  getMultipleDoctors ({
    ids,
    userPermissions,
    permissionCheck = true
  }:
  { ids: string[],
    userPermissions: UserPermissions,
    permissionCheck: boolean }) {
    try {
      const permission = permissionCheck
        ? booleanPermission(permissionRequests.canViewDoctors, { userPermissions })
        : true

      if (!permission) return []

      return this.userService.getMultipleDoctors({ ids, userPermissions, permissionCheck })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUsersWithCapability' })
  async getUsersWithCapability ({
    capability,
    scope,
    ownerId
  }:
  { capability: ICapabilityName,
    scope?: Scope_Name,
    ownerId?: string }) {
    try {
      return this.userService.getUsersWithCapability({ capability, scope, ownerId })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'credential', cmd: 'getCredentialsByEmail' })
  async getCredentialsByEmail ({ email }: { email: string }) {
    try {
      const credential = await this.credentialService.findByEmail({ email })
      if (!credential) return null
      return serializeUser(credential.toJSON())
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUsersWithPassword' })
  async getUsersWithPassword () {
    try {
      const users = await this.userService.getUsersWithPassword()
      return users
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'getUserTenantIds' })
  async getUserTenants ({ userEmail }: { userEmail: string }) {
    try {
      const tenantsIds = await this.userService.getUserTenantIds(userEmail)
      return tenantsIds
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'create' })
  async createMP ({
    data,
    userPermissions
  }: { data: CreateUserPayload,
    userPermissions?: UserPermissions }) {
    try {
      if (process.env.VITE_APP_ENV === 'ci')
        return this.userService.createTestEnv(data)
      const user = await this.userService.create(data, userPermissions)
      return user
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'user', cmd: 'update' })
  async updateMP ({
    data,
    user,
    userId
  }: { userId: string,
    data: EditUserPayload,
    user?: IUser, }) {
    try {
      await this.userService.update(userId, data, user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'users', cmd: 'query' })
  async executeQuery (data: tExecuteQueryPayload) {
    try {
      return this.userService.executeQuery(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @MessagePattern({ role: 'user', cmd: 'getLastDebtorNumber' })
  async normalizeDebtorNumbers () {
    try {
      return await this.userService.getLastDebtorNumber()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'users', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_users)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'users', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.userService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'users', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.userService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
