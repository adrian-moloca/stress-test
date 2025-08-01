import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Role, RoleDocument } from '../schemas/role.schema'
import { Model } from 'mongoose'
import { RoleAssociationService } from './roleAssociation.service'
import { ClientProxy } from '@nestjs/microservices'
import { Capabilities, Component, EntityType, IUser, auditTrailCreate, auditTrailDelete, auditTrailUpdate, callMSWithTimeoutAndRetry } from '@smambu/lib.constantsjs'
import { LoggingService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'
import { RoleAssociation, RoleAssociationDocument } from 'src/schemas/roleAssociation.schema'

@Injectable()
export class RolesService {
  private models: Array<{ model: Model<any>; label: string }>
  constructor (
    @Inject('USERS_CLIENT')
    private readonly userClient: ClientProxy,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    private readonly roleAssociationService: RoleAssociationService,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    private readonly loggingService: LoggingService,
    @InjectModel(RoleAssociation.name)
    private roleAssociationModel: Model<RoleAssociationDocument>,
  ) {
    this.loggingService.setComponent(Component.ROLES)
    this.models = [
      // { model: null, label: 'capabilities' }, // TODO: capabilities database is not used and should be removed
      { model: this.roleAssociationModel, label: 'roleassociations' },
      { model: this.roleModel, label: 'roles' },
    ]
  }

  async findOne (id: string) {
    try {
      return this.roleModel.findById(id)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  find (filters: any) {
    return this.roleModel.find(filters)
  }

  async findOneWithUserCount (id: string) {
    const role = await this.roleModel.findById(id)
    // This is done because mongose 8 makes the return type not inferrable from
    // the "queried" object.
    const roleJson = role.toJSON() as Role

    const rolesAssociationIds = await this.roleAssociationService.distinct(
      '_id',
      { role: role.id },
    )

    const pattern = { role: 'user', cmd: 'getUserCountByRolesAssociationIds' }

    const payloadData = { rolesAssociationIds }

    const userCount = await callMSWithTimeoutAndRetry(this.userClient,
      pattern,
      payloadData,
      Component.ROLES)

    const data = {
      ...roleJson,
      userCount,
    }

    return data
  }

  async findAll () {
    try {
      const roles = await this.roleModel.find().exec()
      const data = []
      for (const role of roles) {
        const rolesAssociationIds = await this.roleAssociationService.distinct(
          '_id',
          { role: role.id },
        )

        const pattern = { role: 'user', cmd: 'getUserCountByRolesAssociationIds' }

        const payloadData = { rolesAssociationIds }

        const userCount = await callMSWithTimeoutAndRetry(this.userClient,
          pattern,
          payloadData,
          Component.ROLES)

        data.push({
          ...role.toJSON(),
          userCount,
        })
      }

      return data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  findRolesByID (roles: string[]) {
    return this.roleModel.find({
      _id: { $in: roles },
    })
  }

  async createOne (data: any, user?: IUser) {
    try {
      const result = await this.roleModel.create(data)

      await auditTrailCreate({
        logClient: this.logClient,
        userId: user?.id,
        entityType: EntityType.ROLE,
        newObj: result.toJSON(),
      })

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteOne (id: string, user: IUser): Promise<any> {
    try {
      const role = await this.findOneWithUserCount(id)
      if (role.userCount > 0)
        throw new BadRequestException('role_delete_userCount_error')

      const previousValue = await this.findOne(id)
      const result = await this.roleModel.deleteOne({ _id: id })

      await auditTrailDelete({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.ROLE,
        prevObj: previousValue.toJSON(),
      })

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async editOne (id: string, data: any, user: IUser) {
    try {
      const previousValue = await this.findOne(id)
      await this.roleModel.updateOne({ _id: id }, data)
      const newValue = await this.findOne(id)

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.ROLE,
        newObj: newValue.toJSON(),
        prevObj: previousValue.toJSON(),
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeDeletedCapabilities () {
    try {
      const roles = await this.roleModel.find().exec()
      for (const role of roles) {
        const capabilitiesStrings = Object.values(Capabilities)
        const filteredCapabilities = role.capabilities
          .filter(capability => Object.values(capabilitiesStrings).includes(capability))

        if (role.capabilities.length === filteredCapabilities.length) continue
        await this.roleModel.updateOne({ _id: role._id }, { capabilities: filteredCapabilities })
      }
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
}
