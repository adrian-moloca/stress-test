import { PermissionsDec, scheduleCaseDTO, lockWeekDto, UserPermissions, parseErrorMessage, checkPermission, permissionRequests } from '@smambu/lib.constantsjs'
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseFilters,
  Param,
  Delete,
  HttpException,
  UseInterceptors,
} from '@nestjs/common'
import { SchedulingService } from 'src/services'
import { ParseScheduleCase } from 'src/pipes/parseScheduleCase'
import { ParseLockWeek } from 'src/pipes/parseLockWeek.pipe'
import { AllExceptionsFilter, LoggingInterceptor } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller('scheduling')
export class SchedulingController {
  constructor (
    private readonly schedulingService: SchedulingService,
  ) { }

  @Post('lockWeek')
  @UseFilters(AllExceptionsFilter)
  async lockWeek (
    @Body(new ParseLockWeek()) data: lockWeekDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canAccessScheduling, { userPermissions })

      const res = await this.schedulingService.lockWeek(data, request.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post(':caseId')
  @UseFilters(AllExceptionsFilter)
  async scheduleCase (
    @Body(new ParseScheduleCase()) data: scheduleCaseDTO,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canAccessScheduling, { userPermissions })

      const res = await this.schedulingService.scheduleCase(data, request.user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':formattedDate')
  @UseFilters(AllExceptionsFilter)
  async getScheduledWeek (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('formattedDate') formattedDate: string,
  ) {
    try {
      checkPermission(permissionRequests.canSchedule, { userPermissions })
      const res = await this.schedulingService.getScheduledWeek(formattedDate)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete('/resetBackup/:formattedDate')
  @UseFilters(AllExceptionsFilter)
  async resetBackup (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('formattedDate') formattedDate: string,
  ) {
    try {
      checkPermission(permissionRequests.canSchedule, { userPermissions })
      const res = await this.schedulingService.resetBackup(formattedDate)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
