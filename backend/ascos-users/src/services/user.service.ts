import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument } from '../schemas/user.schema'
import {
  Capabilities,
  GetUsersQueryDto,
  ICapabilityName,
  permissionRequests,
  Domain_Name,
  ICapabilityKey,
  UserPermissions,
  getCapabilityUsers,
  PERMISSIONS_DOMAINS_SCOPES,
  EntityType,
  IUser,
  auditTrailCreate,
  auditTrailUpdate,
  Component,
  serializeUser,
  ISerializedUser,
  NotificationType,
  NotificationActionType,
  createNotifications,
  Scope_Name,
  callMSWithTimeoutAndRetry,
  booleanPermission,
  tExecuteQueryPayload,
  applyGetQueryPermissions,
  formatExecuteQueryValue,
  SOURCE_SCHEMAS,
} from '@smambu/lib.constantsjs'
import { JwtService } from '@nestjs/jwt'
import { ClientProxy } from '@nestjs/microservices'
import { CreateUserPayload, EditUserPayload } from 'src/pipes'
import { CredentialService } from './credential.service'
import { LoggingService, SendgridService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'

type SearchedUser = ISerializedUser & {
  roles: {
    capabilities: ICapabilityKey[]
    createdAt: string
    domain_scopes: { [key: string]: Domain_Name[] }
    id: string
    name: string
    scope: Domain_Name
    updatedAt: string
    __v: number
    _id: string
  }[]
  isDoctor: boolean
  isAnesthesiologist: boolean;
}

@Injectable()
export class UserService {
  private models: { model: Model<any>; label: string }[]
  constructor (
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('ROLE_CLIENT') private readonly roleClient: ClientProxy,
    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,
    @Inject('LOGS_CLIENT') private readonly logClient: ClientProxy,
    @Inject('NOTIFICATIONS_CLIENT') private readonly notificationsClient: ClientProxy,
    @Inject('TENANTS_CLIENT')
    private readonly tenantsClient: ClientProxy,
    private sendgridService: SendgridService,
    private credentialService: CredentialService,
    private jwtService: JwtService,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.USERS)
    // XXX we should investigate this
    this.models = [
      // { model: null, label: 'credentials' }, // credentials are not reset ever
      // { model: null, label: 'debtornumbers' }, // debtornumbers are not used anymore and should be removed
      // { model: null, label: 'roleassociations' }, // roleassociations are not used anymore and should be removed
      { model: this.userModel, label: 'users' },
    ]
  }

  async get (id: string): Promise<UserDocument> {
    try {
      let user: any = await this.userModel.findById(id)
      if (!user)
        return null
      const pattern = { role: 'roleAssociations', cmd: 'getRoleAssociations' }

      const payloadData = { ids: user.roleAssociations, tenatId: user.tenantId }
      const roleAssociations = await callMSWithTimeoutAndRetry(this.roleClient,
        pattern,
        payloadData,
        Component.USERS)

      user._doc.roleAssociations = Object.values(roleAssociations)
      return user
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getMultipleUsers (ids: string[]): Promise<ISerializedUser[]> {
    try {
      const users = await this.userModel.find({ _id: { $in: ids } }).populate({ path: 'roleAssociations' })
      return this.parseUsersWithRoles(users)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getMultipleDoctors ({
    ids,
    userPermissions,
    permissionCheck = true,
  }: {
    ids: string[],
    userPermissions: UserPermissions,
    permissionCheck: boolean,
  }): Promise<ISerializedUser[]> {
    try {
      const permittedDoctors = permissionCheck
        ? getCapabilityUsers(Capabilities.P_DOCTORS_VIEW, userPermissions)
        : PERMISSIONS_DOMAINS_SCOPES.ALL_DATA

      const users = await this.userModel
        .find({
          _id: {
            $in: ids
              .filter(id => permittedDoctors === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
                 permittedDoctors.includes(id))
          }
        })
      return this.parseUsersWithRoles(users)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findByEmail (email: string): Promise<UserDocument> {
    try {
      return this.userModel.findOne({ email })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUserCountByRolesAssociationIds (rolesAssociationIds: string[]): Promise<number> {
    try {
      return this.userModel.countDocuments({
        roleAssociations: { $in: rolesAssociationIds },
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAllDoctors ({
    userPermissions,
  }: {
    userPermissions: UserPermissions,
  }): Promise<SearchedUser[]> {
    try {
      const permittedDoctors = getCapabilityUsers(Capabilities.P_DOCTORS_VIEW, userPermissions)
      const users = await this.getAll()

      const doctors = users
        .filter(user => user.isDoctor &&
          (permittedDoctors === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
          permittedDoctors.includes(user._id)))
      return doctors
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async parseUsersWithRoles (users: any[]): Promise<SearchedUser[]> {
    const rolesAssociationIds = users.reduce(
      (acc, user) => [...acc, ...user.roleAssociations],
      [] as string[],
    )

    const store = global.als.getStore()

    const pattern = { role: 'roles', cmd: 'getRoleByRoleAssociations' }

    const payloadData = { ids: rolesAssociationIds, ...(store ?? {}) }
    const roles = await callMSWithTimeoutAndRetry(this.roleClient,
      pattern,
      payloadData,
      Component.USERS)

    return users.map(user => {
      const rolesInfo = (user.roleAssociations ?? [])
        .map(roleAssociationId => roles[roleAssociationId]).filter(Boolean)
      let isDoctor = false
      let isAnesthesiologist = false

      for (let i = 0; i < rolesInfo.length; i++)
        if (rolesInfo[i].capabilities.includes(Capabilities.U_IS_DOCTOR)) {
          isDoctor = true
          break
        }

      for (let i = 0; i < rolesInfo.length; i++)
        if (rolesInfo[i].capabilities.includes(Capabilities.U_IS_ANESTHESIOLOGIST)) {
          isAnesthesiologist = true
          break
        }

      return {
        ...serializeUser(user.toObject()),
        id: user._id,
        roles: (user.roleAssociations ?? [])
          .map(roleAssociationId => roles[roleAssociationId]).filter(Boolean),
        isDoctor,
        isAnesthesiologist,
      }
    })
  }

  async searchDoctorsBySearchWords (searchWords?: string[]): Promise<SearchedUser[]> {
    const searchWordsRegex = searchWords.map(searchWord => new RegExp(searchWord, 'i'))
    const query = this.userModel.find({
      $or: [
        {
          firstName: { $in: searchWordsRegex },
        },
        {
          lastName: { $in: searchWordsRegex },
        },
      ],
    })
    const users = await query.exec()

    return this.parseUsersWithRoles(users)
  }

  async getAnesthesiologists (userPermissions: UserPermissions): Promise<SearchedUser[]> {
    try {
      const viewableUsersIds = getCapabilityUsers(Capabilities.P_ANESTHESIOLOGISTS_VIEW,
        userPermissions)
      const users = await this.getAll()

      const Anesthesiologists = users.filter(user => user.isAnesthesiologist &&
        (viewableUsersIds === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
          viewableUsersIds.includes(user._id)))
      return Anesthesiologists
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAllByEmail (queries: GetUsersQueryDto): Promise<SearchedUser[]> {
    try {
      const { search } = queries
      const query = this.userModel.find({ email: search })

      const users = await query.exec()

      return this.parseUsersWithRoles(users)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAll (queries?: GetUsersQueryDto, credentialsData?: boolean): Promise<SearchedUser[]> {
    try {
      const search = queries?.search

      let query
      if (search === null || search === undefined || search === '')
        query = this.userModel.find({})
      else
        query = this.userModel.find(
          search
            ? {
              $or: [
                {
                  $expr: {
                    $regexMatch: {
                      input: { $concat: ['$firstName', ' ', '$lastName'] },
                      regex: search.toLowerCase(),
                      options: 'i',
                    },
                  },
                },
                {
                  email: new RegExp(search, 'gi'),
                },
              ],
            }
            : {},
        )

      const users = await query.exec()

      if (credentialsData) {
        const emails = users.map(user => user.email)
        const credentialsData = (await this.credentialService.getCredentialsData(emails))
          .reduce((acc, credentialData) => ({ ...acc, [credentialData.email]: credentialData }), {})

        const parsedUsers = await this.parseUsersWithRoles(users)
        return parsedUsers.map(user => ({
          ...user,
          ...credentialsData[user.email],
        }))
      }

      return this.parseUsersWithRoles(users)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUserByEmailAndTenantId ({ email, tenantId }:
  { email: string; tenantId: string }): Promise<UserDocument> {
    try {
      return this.userModel.findOne({ email, tenantId })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async checkForDuplicateEmail (email: string, throwError?: boolean) {
    const user = await this.userModel.exists({ email })
    if (user?._id != null && throwError)
      throw new BadRequestException('user_emailAlreadyExists_error')

    return user?._id != null
  }

  async create (
    data: CreateUserPayload,
    userPermissions?: UserPermissions,
  ) {
    try {
      // if there is no userPermissions, it means that the user is created by the system
      const hasActivatePermission = userPermissions !== undefined
        ? booleanPermission(permissionRequests.canActivateUser, {
          userPermissions,
        })
        : true

      await this.checkForDuplicateEmail(data.email, true)

      const pattern = { role: 'userDebtorNumber', cmd: 'get' }

      const newDebtorNumber = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        {},
        Component.USERS)

      const { verified } = await this.credentialService.createOne({ email: data.email })

      const user: UserDocument = await this.userModel.create({
        ...data,
        active: !!hasActivatePermission,
        activatedAt: hasActivatePermission ? new Date() : null,
        debtorNumber: newDebtorNumber,
      })

      if (!verified) {
        const token = this.jwtService.sign({ email: user.email }, {})
        await this.sendgridService.sendVerifyEmail(user, token)
      }

      if (!hasActivatePermission) {
        const users = await this.getAll()
        const usersWithActivatePermission = users.filter(
          _user =>
            !!(_user as any).roles?.find(_role =>
              _role.capabilities.includes(Capabilities.P_USERS_ACTIVATE)),
        )
        usersWithActivatePermission.forEach(
          _user =>
            this.sendgridService.sendActivateUserRequest(_user, user.id),
        )
      }

      await auditTrailCreate({
        logClient: this.logClient,
        userId: user?.id,
        entityType: EntityType.USER,
        newObj: user.toObject(),
      })
      return serializeUser(user.toObject())
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUserById (id: string) {
    const user = await this.userModel.findOne({ _id: id })

    return user
  }

  async update (id: string, data: EditUserPayload, user?: IUser): Promise<void> {
    try {
      const oldData: UserDocument = await this.userModel.findOne({ _id: id })

      let newData: EditUserPayload | UserDocument = {
        ...data,
        activatedAt: !oldData.active && data.active ? new Date() : oldData.activatedAt,
      }

      if ((oldData.email !== data.email) && data.email !== undefined) {
        await this.checkForDuplicateEmail(data.email, true)

        const { verified } = await this.credentialService.createOne({ email: data.email })

        if (!verified) {
          const token = this.jwtService.sign({ email: data.email }, {})
          const user = {
            email: data.email,
            firstName: newData.firstName ?? oldData.firstName,
            lastName: newData.lastName ?? oldData.lastName,
          }

          await this.sendgridService.sendVerifyEmail(user, token)
        }
      }

      await this.userModel.updateOne({ _id: id }, newData)
      const newValue = await this.userModel.findOne({ _id: id })

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user?.id,
        entityType: EntityType.USER,
        prevObj: oldData.toObject(),
        newObj: newValue.toObject(),
      })

      createNotifications(this.notificationsClient, {
        usersIds: [id],
        type: NotificationType.USER_UPDATED,
        title: 'notifications_userUpdated_title',
        body: 'notifications_userUpdated_body',
        action: {
          type: NotificationActionType.INTERNAL_LINK,
          url: `/users/${id}`,
        },
      })

      const store = global.als.getStore()
      const tenantId = store?.tenantId

      if (tenantId === null || tenantId === undefined)
        throw new Error('Missing tenant')
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUsersWithCapability ({
    capability,
    scope,
    ownerId
  }: {
    capability: ICapabilityName,
    scope?: Scope_Name,
    ownerId?: string
  }) {
    const { capabilitiesList } = await callMSWithTimeoutAndRetry(
      this.systemConfigurationClient,
      { role: 'systemConfigurations', cmd: 'getCapabilitiesList' },
      {},
      Component.USERS
    )

    const matchingCapability = capabilitiesList.find(current => {
      const nameMatch = current.name === capability
      const composeMatch = `${current.name}:${current.permission}` === capability

      return nameMatch || composeMatch
    })

    const domain = matchingCapability?.domain
    if (domain === undefined)
      throw new BadRequestException('capability_notFound_error')

    const pattern = { role: 'roleAssociations', cmd: 'getRoleAssociationsByCapability' }

    const payloadData = { capability }

    const rolesAssociations = await callMSWithTimeoutAndRetry(this.roleClient,
      pattern,
      payloadData,
      Component.USERS)

    const allDataRolesAssociations = scope == null || scope === Scope_Name.ALL_DATA
      ? rolesAssociations
        .filter(roleAssociation => roleAssociation.role
          .domain_scopes[domain] === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
        .map(roleAssociation => roleAssociation.id)
      : []

    const anotherUserDataRolesAssociations = scope == null || scope === Scope_Name.OTHER_USER_DATA
      ? rolesAssociations
        .filter(roleAssociation => roleAssociation.role
          .domain_scopes[domain] === PERMISSIONS_DOMAINS_SCOPES.ANOTHER_USER_DATA &&
        (!ownerId || roleAssociation.users.includes(ownerId)))
        .map(roleAssociation => roleAssociation.id)
      : []

    const ownDataRolesAssociations = scope == null || scope === Scope_Name.OWN_DATA
      ? rolesAssociations
        .filter(roleAssociation => roleAssociation.role
          .domain_scopes[domain] === PERMISSIONS_DOMAINS_SCOPES.OWN_DATA)
        .map(roleAssociation => roleAssociation.id)
      : []

    let users
    if (!ownerId) {
      users = this.userModel.find({
        roleAssociations: {
          $in: [
            ...allDataRolesAssociations,
            ...anotherUserDataRolesAssociations,
            ...ownDataRolesAssociations
          ]
        }
      })
    } else {
      const allDataUsers = await this.userModel.find({
        roleAssociations: { $in: allDataRolesAssociations }
      })
      const anotherUserDataUsers = await this.userModel.find({
        roleAssociations: { $in: anotherUserDataRolesAssociations }
      })

      const ownDataUsers = await this.userModel.find({
        roleAssociations: { $in: ownDataRolesAssociations }, _id: ownerId
      })

      users = [...allDataUsers, ...anotherUserDataUsers, ...ownDataUsers]
    }

    return users
  }

  async getUsersWithPassword () {
    const users = await this.userModel.find({
      password: {
        $exists: true
      }
    })
    return users
  }

  async getUserTenantIds (userEmail: string) {
    const users = await this.userModel.find({
      email: userEmail
    })
    return users.map(u => u.tenantId)
  }

  async getTenantById (tenantId: string) {
    const pattern = { role: 'tenants', cmd: 'getTenantById' }

    const payloadData = { id: tenantId }
    const tenant = await callMSWithTimeoutAndRetry(this.tenantsClient,
      pattern,
      payloadData,
      Component.USERS)

    return tenant
  }

  async getLastDebtorNumber () {
    try {
      const lastDebtorNumber = await this.userModel.aggregate([
        {
          $addFields: {
            debtorNumberAsNumber: { $toDouble: '$debtorNumber' }
          }
        },
        {
          $sort: { debtorNumberAsNumber: -1 }
        },
        {
          $limit: 1
        }
      ])

      return lastDebtorNumber[0]?.debtorNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async generateIds (data: Record<string, any[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async resetData (data: Record<string, any[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createTestEnv (data: CreateUserPayload) {
    try {
      await this.checkForDuplicateEmail(data.email, true)

      const pattern = { role: 'userDebtorNumber', cmd: 'get' }

      const newDebtorNumber = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        {},
        Component.USERS)

      await this.credentialService.createOneTestEnv({ email: data.email })

      const user: UserDocument = await this.userModel.create({
        ...data,
        active: true,
        activatedAt: new Date(),
        debtorNumber: newDebtorNumber,
      })

      await auditTrailCreate({
        logClient: this.logClient,
        userId: user?.id,
        entityType: EntityType.USER,
        newObj: user.toObject(),
      })
      return serializeUser(user.toObject())
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async executeQuery ({
    query,
    select,
    sort,
    userPermissions,
    __ignorePermissions,
  }: tExecuteQueryPayload) {
    try {
      let parsedQuery = query
      if (!__ignorePermissions)
        parsedQuery = applyGetQueryPermissions('users', query, userPermissions)

      const users = await this.userModel
        .find(parsedQuery)
        .select(select)
        .sort(sort)
        .lean()

      const getUserDeps = user => [{ path: `${SOURCE_SCHEMAS.USERS}.${user._id}` }]

      const result = formatExecuteQueryValue(
        SOURCE_SCHEMAS.USERS,
        query,
        users,
        getUserDeps,
      )

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
