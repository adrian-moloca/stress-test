import {
  Body,
  Controller,
  Get,
  Put,
  Param,
  Post,
  Query,
  UseFilters,
  Delete,
  Req,
  HttpException,
  UseInterceptors
} from '@nestjs/common'
import {
  CreateContractDto,
  PermissionsDec,
  checkPermission,
  permissionRequests,
  QueryContractDto,
  CreateOpStandardDto,
  UserPermissions,
  booleanPermission,
  EditContractDto,
  parseErrorMessage,
  IUser,
  backendConfiguration,
  tExecuteQueryPayload,
} from '@smambu/lib.constantsjs'
import { ContractsService } from 'src/services'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { LoggingInterceptor, MPInterceptor, exportData, AllExceptionsFilter } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller('contracts')
export class ContractsController {
  constructor (private readonly contractService: ContractsService) { }

  @Post('/op-standards')
  @UseFilters(AllExceptionsFilter)
  async createOpStandard (
    @Body() data: CreateOpStandardDto,
    @PermissionsDec() userPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canCreateOpStandards, { userPermissions })
      const res = await this.contractService.createOpStandard(data, req.user.id)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/op-standards')
  @UseFilters(AllExceptionsFilter)
  async getOpStandards (@Query() query: QueryContractDto, @PermissionsDec() userPermissions) {
    try {
      checkPermission(permissionRequests.canViewOpStandards, { userPermissions })
      const res = await this.contractService.getOpStandards(query)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/op-standards/notLinked/:contractId/:doctorId')
  @UseFilters(AllExceptionsFilter)
  async getNotLinkedOpStandards (
    @Param('contractId') contractId: string,
    @Param('doctorId') doctorId: string,
    @PermissionsDec() userPermissions
  ) {
    try {
      checkPermission(permissionRequests.canViewOpStandards, { userPermissions })
      const res = await this.contractService.getNotLinkedOpStandards({ contractId, doctorId })
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/op-standards/:id')
  @UseFilters(AllExceptionsFilter)
  async getSingleOpStandard (@Param('id') id: string, @PermissionsDec() userPermissions) {
    try {
      checkPermission(permissionRequests.canViewOpStandards, { userPermissions })
      const res = await this.contractService.getSingleOpStandard(id)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put('/op-standards/changeRequest/:id')
  @UseFilters(AllExceptionsFilter)
  async updateChangeRequest (
    @Param('id') id: string,
    @Body() data,
    @Req() req: any
  ) {
    try {
      const res = await this.contractService.updateChangeRequest(id, data.changeRequest, req.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put('/op-standards/:id')
  @UseFilters(AllExceptionsFilter)
  async updateSingleOpStandard (
    @Param('id') id: string,
    @Body() data,
    @PermissionsDec() userPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canEditOpStandards, { userPermissions })
      const res = await this.contractService.updateOpStandard(id, data, req.user.id)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete('/op-standards/:opId')
  @UseFilters(AllExceptionsFilter)
  async removeSingleOpStandard (
    @Param('opId') opId: string,
    @Body() data,
    @PermissionsDec() userPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canDeleteOpStandards, { userPermissions })
      const { contractId } = data
      await this.contractService.removeOpStandard(opId, req.user.id, contractId)

      return true
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async create (
    // UR TODO: renable the pipe after normalizing the data
    // @Body(new CreateContractValidatorPipe()) data: CreateContractDto,
    @Body() data: CreateContractDto,
    @PermissionsDec() userPermissions,
    @Req() req
  ): Promise<any> {
    try {
      checkPermission(permissionRequests.canCreateContract, { userPermissions })
      const res = await this.contractService.createOne(data, userPermissions, req.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/doctorOpstandards')
  @UseFilters(AllExceptionsFilter)
  async getDoctorOpstandards (@Query('doctorId') doctorId: string, @PermissionsDec() userPermissions: UserPermissions) {
    try {
      checkPermission(permissionRequests.canViewOpStandards, { userPermissions })
      const opstandards = this.contractService.getDoctorOpstandards(doctorId, userPermissions)
      return opstandards
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async findContracts (
    @Query() query: QueryContractDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canViewContracts, { userPermissions })
      const res = await this.contractService.findContracts(query, userPermissions, req.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/getContractsByIds')
  @UseFilters(AllExceptionsFilter)
  async getContractsByIds (
    @Query() query: { contractsIds: string[] },
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canViewContracts, { userPermissions })
      const res = await this.contractService.getContractsByIds(query, userPermissions, req.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/:id')
  @UseFilters(AllExceptionsFilter)
  async getContractById (@Param('id') id: string, @PermissionsDec() userPermissions: UserPermissions, @Req() req) {
    try {
      checkPermission(permissionRequests.canViewContracts, { userPermissions })
      const contract = await this.contractService.findContract(id, userPermissions, req.user)
      return contract
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
    // UR TODO: renable the pipe after normalizing the data
    // @Body(new EditContractValidatorPipe()) data: EditContractDto,
    @Body() data: EditContractDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req
  ): Promise<any> {
    try {
      checkPermission(permissionRequests.canEditContracts, { userPermissions })
      const contract = await this.contractService.updateContract(id,
        data,
        userPermissions,
        req.user)
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
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canDeleteContracts, { userPermissions })
      this.contractService.deleteContract(id, req.user, userPermissions)

      return true
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'contracts', cmd: 'getOpStandard' })
  async getOpStandardMessagePattern ({
    id,
    userPermissions,
  }: {
    id: string;
    userPermissions: UserPermissions;
  }) {
    try {
      const permission = booleanPermission(permissionRequests.canViewOpStandards,
        { userPermissions })
      if (!permission) return {}
      const opStandard = await this.contractService.getSingleOpStandard(id)
      return opStandard
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'contracts', cmd: 'getContract' })
  async getOpContractMessagePattern ({
    id,
    userPermissions,
    user,
    permissionCheck = true,
    noSurgerySlots = false
  }: {
    id: string;
    userPermissions: UserPermissions | null;
    user: IUser | null;
    permissionCheck: boolean;
    noSurgerySlots: boolean;
  }) {
    try {
      let permission = false
      if (permissionCheck)
        permission = booleanPermission(permissionRequests.canViewContracts, { userPermissions })
      if (!permission && permissionCheck === true) return {}

      const contract = await this.contractService.findContract(
        id,
        userPermissions,
        user,
        permissionCheck,
        noSurgerySlots
      )
      return contract
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'contracts', cmd: 'isOrUsedInOpstandards' })
  async getIsOrUsedInOpstandards ({
    id,
  }: {
    id: string
  }) {
    try {
      return this.contractService.getIsOrUsedInOpstandards(id)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'contracts', cmd: 'query' })
  async executeQuery (data: tExecuteQueryPayload) {
    try {
      return this.contractService.executeQuery(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'contracts', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_contracts)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'contracts', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.contractService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'contracts', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.contractService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
