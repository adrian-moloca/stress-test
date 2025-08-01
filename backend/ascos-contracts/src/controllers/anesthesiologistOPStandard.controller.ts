import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import {
  PermissionsDec,
  checkPermission,
  permissionRequests,
  QueryAnesthesiologistOpStandardDto,
  CreateAnesthesiologistOpStandardDto,
  UpdateAnesthesiologistOpStandardDto,
  UserPermissions,
  parseErrorMessage,
} from '@smambu/lib.constantsjs'
import { AnesthesiologistOpStandardService } from 'src/services'
import { UpsertAnesthesiologistOpStandardPipe } from 'src/pipes'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor } from '@smambu/lib.commons-be'
import { MessagePattern, RpcException } from '@nestjs/microservices'

@UseInterceptors(LoggingInterceptor)
@Controller('anesthesiologist-op-standard')
export class AnesthesiologistOPStandardController {
  constructor (
    private readonly anesthesiologistOpStandardService: AnesthesiologistOpStandardService,
  ) { }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async createOpStandard (
    @Body() data: CreateAnesthesiologistOpStandardDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canCreateAnesthesiologistOpStandard, {
        userPermissions,
      })
      const res =
        await this.anesthesiologistOpStandardService.createAnesthesiologistOpStandard(
          data,
          req.user.id
        )
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async findAnesthesiologistOPStandards (
    @Query() query: QueryAnesthesiologistOpStandardDto,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canViewAnesthesiologistOpStandards, {
        userPermissions,
      })
      const res =
        this.anesthesiologistOpStandardService.findAnesthesiologistOpStandards(
          query,
          userPermissions,
        )
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/all')
  @UseFilters(AllExceptionsFilter)
  async findAll (
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canViewAnesthesiologistOpStandards, {
        userPermissions,
      })
      const res = this.anesthesiologistOpStandardService.findAll(userPermissions)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'anestOpStandard', cmd: 'getAll' })
  async getAll () {
    try {
      const res = this.anesthesiologistOpStandardService.findAll(null, true)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Get('/getNames')
  @UseFilters(AllExceptionsFilter)
  async getNames (
    @PermissionsDec() userPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canViewAnesthesiologistOpStandards, {
        userPermissions,
      })
      const res = await this.anesthesiologistOpStandardService.getNames()
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/:id')
  @UseFilters(AllExceptionsFilter)
  async getAnesthesiologistOPStandardById (
    @Param('id') id: string,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canViewAnesthesiologistOpStandards, { userPermissions })
      return this.anesthesiologistOpStandardService.findAnesthesiologistOpStandardById(
        id,
        userPermissions,
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put('/:id')
  @UseFilters(AllExceptionsFilter)
  async updateAnesthesiologistOPStandard (
    @Param('id') id: string,
    @Body(new UpsertAnesthesiologistOpStandardPipe())
    data: UpdateAnesthesiologistOpStandardDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req
  ): Promise<any> {
    try {
      checkPermission(permissionRequests.canEditAnesthesiologistOpStandards, { userPermissions })
      const anesthesiologistOPStandard =
        await this.anesthesiologistOpStandardService.updateAnesthesiologistOpStandard(
          id,
          data,
          userPermissions,
          req.user.id
        )
      return anesthesiologistOPStandard
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete('/:id')
  @UseFilters(AllExceptionsFilter)
  async deleteAnesthesiologistOPStandard (
    @Param('id') id: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canDeleteAnesthesiologistOpStandards, { userPermissions })
      this.anesthesiologistOpStandardService.deleteAnesthesiologistOpStandard(id,
        userPermissions,
        req.user.id)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/near-versions/:id')
  @UseFilters(AllExceptionsFilter)
  async nextVersion (
    @Param('id') id: string,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canViewAnesthesiologistOpStandards, {
        userPermissions,
      })
      const res = this.anesthesiologistOpStandardService.findNearVersions(id, userPermissions)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/new-version/:id')
  @UseFilters(AllExceptionsFilter)
  async createOpStandardVersion (
    @Param('id') id: string,
    @Body() data: CreateAnesthesiologistOpStandardDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req
  ) {
    try {
      checkPermission(permissionRequests.canCreateAnesthesiologistOpStandard, {
        userPermissions,
      })
      const res =
        await this.anesthesiologistOpStandardService.createAnesthesiologistOpStandardNewVersion(
          data,
          id,
          userPermissions,
          req.user.id
        )
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
