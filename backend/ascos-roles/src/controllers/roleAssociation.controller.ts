import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { RoleAssociationService } from '../services'
import { CreateRoleAssociationDto, parseErrorMessage } from '@smambu/lib.constantsjs'
import { MPInterceptor, LoggingInterceptor, AllExceptionsFilter } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller('role-associations')
export class RoleAssociationController {
  constructor (
    private readonly roleAssociationService: RoleAssociationService,
  ) { }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async create (@Body() data) {
    try {
      const res = this.roleAssociationService.createOne(data)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async findAll () {
    try {
      return this.roleAssociationService.findAll()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':id')
  @UseFilters(AllExceptionsFilter)
  async findOne (@Param('id') id: string): Promise<any> {
    try {
      return this.roleAssociationService.findOne(id)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete(':id')
  @UseFilters(AllExceptionsFilter)
  async delete (@Param('id') id: string): Promise<any> {
    try {
      return await this.roleAssociationService.deleteOne(id)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put(':id')
  @UseFilters(AllExceptionsFilter)
  async update (@Param('id') id: string, @Body() data: any): Promise<any> {
    try {
      return this.roleAssociationService.updateOne(id, data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post(':id/users/:userId')
  @UseFilters(AllExceptionsFilter)
  async addUser (@Param('id') id: string, @Param('userId') userId: string) {
    try {
      return this.roleAssociationService.addUser(id, userId)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'roleAssociation', cmd: 'create' })
  async createMP (data: CreateRoleAssociationDto) {
    try {
      const roleAssociation = await this.roleAssociationService.createOne(data)
      return roleAssociation.toObject()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
