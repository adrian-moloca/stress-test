import { ICapabilityName, ICreateRoleRequest, IUser, PermissionsDec, backendConfiguration, parseErrorMessage, checkPermission, permissionRequests } from '@smambu/lib.constantsjs'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Req,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { RoleAssociationService } from 'src/services'
import { RolesService } from 'src/services/roles.service'
import { MPInterceptor, LoggingInterceptor, exportData, AllExceptionsFilter } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Role, RoleDocument } from 'src/schemas/role.schema'
import { Model } from 'mongoose'

@UseInterceptors(LoggingInterceptor)
@Controller('roles')
export class RolesController {
  constructor (
    private readonly rolesService: RolesService,
    private readonly roleAssociationService: RoleAssociationService,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) { }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async create (@Body() data, @PermissionsDec() userPermissions, @Req() req) {
    try {
      checkPermission(permissionRequests.canCreateRole, { userPermissions })
      const res = this.rolesService.createOne(data, req.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async findAll (@PermissionsDec() userPermissions) {
    try {
      checkPermission(permissionRequests.canViewRoles, { userPermissions })
      return this.rolesService.findAll()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':id')
  @UseFilters(AllExceptionsFilter)
  async findOne (
    @Param('id') id: string,
    @PermissionsDec() userPermissions,
  ): Promise<any> {
    try {
      // TODO should be Promise<Role> ??
      checkPermission(permissionRequests.canViewRoles, { userPermissions })
      return this.rolesService.findOne(id)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete(':id')
  @UseFilters(AllExceptionsFilter)
  async delete (
    @Param('id') id: string,
    @PermissionsDec() userPermissions,
    @Req() req,
  ): Promise<any> {
    try {
      checkPermission(permissionRequests.canDeleteRole, { userPermissions })

      return await this.rolesService.deleteOne(id, req.user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Patch(':id')
  @UseFilters(AllExceptionsFilter)
  async edit (
    @Param('id') id: string,
    @Body() data: any,
    @PermissionsDec() userPermissions,
    @Req() req,
  ) {
    try {
      checkPermission(permissionRequests.canEditRoles, { userPermissions })
      return this.rolesService.editOne(id, data, req.user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roles', cmd: 'getRoleByRoleAssociations' })
  async getRolesByRoleAssociations (data: {ids: string[]}) {
    try {
      const roleAssociations = await this.roleAssociationService.find({
        _id: { $in: data.ids },
      })
      const rolesIds = roleAssociations.reduce((acc, roleAssociation) => {
        if (!acc.includes(roleAssociation.role)) acc.push(roleAssociation.role)
        return acc
      }, [])
      const roles = await this.rolesService.find({
        _id: { $in: rolesIds },
      })

      return roleAssociations.reduce(
        (acc, roleAssociation) => ({
          ...acc,
          [roleAssociation._id]: roles.find(
            role => String(role._id) === roleAssociation.role,
          ),
        }),
        {},
      )
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roleAssociations', cmd: 'getRoleAssociations' })
  async getRoleAssociations ({ ids }: {ids: string[]}) {
    try {
      const roleAssociations = await this.roleAssociationService.find({
        _id: { $in: ids },
      })
      return roleAssociations.reduce(
        (acc, roleAssociation) => ({
          ...acc,
          [roleAssociation._id]: roleAssociation,
        }),
        {},
      )
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roleAssociations', cmd: 'getRoleAssociationsByCapability' })
  async getRoleAssociationsByCapability ({ capability }: { capability: ICapabilityName }) {
    try {
      const roles = await this.rolesService.find({
        capabilities: capability,
      })

      const roleAssociationsWithRole = await this.roleAssociationService.findWithRole({
        role: { $in: roles.map(role => String(role._id)) },
      })

      return roleAssociationsWithRole
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roles', cmd: 'create' })
  async createMP ({ data, user }: { data: ICreateRoleRequest, user?: IUser }) {
    try {
      const res = this.rolesService.createOne(data, user)
      return res
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roles', cmd: 'exportData' })
  async export () {
    try {
      return exportData(backendConfiguration().mongodb_uri_roles)
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }

  @Post('/normalize/deletedCapabilities')
  @UseFilters(AllExceptionsFilter)
  async normalizeUsersWithPassword () {
    try {
      const als = global.als
      const store = { bypassTenant: true }
      als.enterWith(store)

      const res = await this.rolesService.normalizeDeletedCapabilities()
      return res
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roles', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.rolesService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roles', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.rolesService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
