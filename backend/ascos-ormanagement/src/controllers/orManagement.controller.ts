import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Req, UseFilters, UseInterceptors } from '@nestjs/common'
import {
  OperatingRoom,
  PermissionsDec,
  UserPermissions,
  backendConfiguration,
  checkPermission,
  parseErrorMessage,
  permissionRequests,
  tExecuteQueryPayload,
} from '@smambu/lib.constantsjs'
import { OrManagementService } from 'src/services'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor, exportData } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller('or-management')
export class OrManagementController {
  constructor (private readonly operatingRoomService: OrManagementService) { }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async createOpStandard (
    @Body() data: OperatingRoom,
    @PermissionsDec() userPermissions,
    @Req() req,
  ) {
    try {
      checkPermission(permissionRequests.canCreateOr, {
        userPermissions,
      })
      const res = await this.operatingRoomService.createOperatingRoom(data, req.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/isOrUsed/:id')
  @UseFilters(AllExceptionsFilter)
  async isOrUsed (
    @Param('id') id: string,
  ) {
    try {
      const res = await this.operatingRoomService.isOrUsed(id)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('')
  @UseFilters(AllExceptionsFilter)
  async findAll () {
    try {
      const res = this.operatingRoomService.findAll()
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/:id')
  @UseFilters(AllExceptionsFilter)
  async getOperatingRoomById (@Param('id') id: string) {
    try {
      return this.operatingRoomService.findOperatingRoomById(id)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put('/:id')
  @UseFilters(AllExceptionsFilter)
  async updateContract (
    @Param('id') id: string,
    @Body()
    data: OperatingRoom,
    @PermissionsDec() userPermissions,
    @Req() req,
  ): Promise<any> {
    try {
      checkPermission(permissionRequests.canEditOr, { userPermissions })
      const contract = await this.operatingRoomService.updateOperatingRoom(id, data, req.user)
      return contract
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete('/:id')
  @UseFilters(AllExceptionsFilter)
  async deleteContract (
    @Param('id') id: string,
    @PermissionsDec() userPermissions,
    @Req() req,
  ) {
    try {
      checkPermission(permissionRequests.canDeleteOr, { userPermissions })
      await this.operatingRoomService.deleteOperatingRoom(id, req.user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'orManagement', cmd: 'getAll' })
  async findAllMP () {
    try {
      const res = this.operatingRoomService.findAll()
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'orManagement', cmd: 'isOrUsed' })
  async isOrUsedMessagePattern ({
    id,
  }: {
    id: string
  }) {
    try {
      const res = await this.operatingRoomService.isOrUsed(id)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'orManagement', cmd: 'getCaseRoom' })
  async getCaseRoomMessagePattern ({
    bookingDate,
    opStandardId,
    userPermissions,
  }: {
    userPermissions: UserPermissions
    bookingDate: Date
    opStandardId: string
  }) {
    try {
      const roomId = await this.operatingRoomService.getCaseRoom({
        bookingDate,
        opStandardId,
        userPermissions,
      })

      return roomId
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'orManagement', cmd: 'query' })
  async executeQuery (data: tExecuteQueryPayload) {
    try {
      return this.operatingRoomService.executeQuery(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'orManagement', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_ormanagement)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'orManagement', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.operatingRoomService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'orManagement', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.operatingRoomService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
