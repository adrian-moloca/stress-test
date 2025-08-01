import { Body, Controller, Get, Param, Post, Query, UseFilters, UseInterceptors } from '@nestjs/common'
import {
  PermissionsDec,
  checkPermission,
  permissionRequests,
  CreateLogDto,
  QueryLogDto,
  parseErrorMessage,
} from '@smambu/lib.constantsjs'
import { LogsService } from 'src/services/logs.service'
import { MessagePattern, RpcException } from '@nestjs/microservices'

import { MPInterceptor, LoggingInterceptor, AllExceptionsFilter } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller('logs')
export class LogsController {
  constructor (private readonly logsService: LogsService) { }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async create (@Body() data: CreateLogDto, @PermissionsDec() userPermissions): Promise<any> {
    checkPermission(permissionRequests.canCreateLog, { userPermissions })
    const res = await this.logsService.createOne(data)
    return res
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async getLogs (@Query() query: QueryLogDto, @PermissionsDec() userPermissions) {
    checkPermission(permissionRequests.canViewLogs, { userPermissions })
    const res = await this.logsService.findLogs(query)
    return res
  }

  @Get('/:id')
  @UseFilters(AllExceptionsFilter)
  async getLogById (@Param('id') id: string, @PermissionsDec() userPermissions) {
    checkPermission(permissionRequests.canViewLogs, { userPermissions })
    const contract = await this.logsService.findLog(id)

    return contract
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'log', cmd: 'createOne' })
  async createOne (data: CreateLogDto) {
    try {
      await this.logsService.createOne(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'logs', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.logsService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'logs', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.logsService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
