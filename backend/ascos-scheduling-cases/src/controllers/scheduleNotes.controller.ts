import { AllExceptionsFilter, LoggingInterceptor } from '@smambu/lib.commons-be'
import { Body, Controller, Get, HttpException, Patch, Post, Query, UseFilters, UseInterceptors } from '@nestjs/common'
import { ScheduleNotesService } from 'src/services/scheduleNotes.service'
import { checkPermission, eScheduleNoteTimeSteps, IUser, parseErrorMessage, permissionRequests, PermissionsDec, tCreateScheduleNoteDto, tEditScheduleNoteDto, UserDec, UserPermissions } from '@smambu/lib.constantsjs'

@UseInterceptors(LoggingInterceptor)
@Controller('scheduleNotes')
export class ScheduleNotesController {
  constructor (
    private readonly scheduleNotesService: ScheduleNotesService,
  ) { }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async createScheduleNote (
    @Body() data: tCreateScheduleNoteDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @UserDec() user: IUser
  ) {
    try {
      checkPermission(permissionRequests.canEditScheduleNotes, { userPermissions })

      const res = await this.scheduleNotesService.createScheduleNote(data, user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Patch()
  @UseFilters(AllExceptionsFilter)
  async editScheduleNote (
    @Body() data: tEditScheduleNoteDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @UserDec() user: IUser
  ) {
    try {
      checkPermission(permissionRequests.canEditScheduleNotes, { userPermissions })

      const res = await this.scheduleNotesService.editScheduleNote(data, user)
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('')
  @UseFilters(AllExceptionsFilter)
  async getScheduleNotes (
    @PermissionsDec() userPermissions: UserPermissions,
    @Query() {
      page = 1,
      limit = 10,
      timeStep,
      timestamp,
    }: {
      page: number,
      limit: number,
      timeStep: string,
      timestamp: number,
    },
  ) {
    try {
      checkPermission(permissionRequests.canViewScheduleNotes, { userPermissions })

      if (!Object.values(eScheduleNoteTimeSteps).includes(timeStep as eScheduleNoteTimeSteps))
        throw new HttpException('Invalid timeStep', 400) // This should never happen

      const res = await this.scheduleNotesService.getScheduleNotes(
        timeStep as eScheduleNoteTimeSteps,
        timestamp,
        Number(page),
        Number(limit),
      )
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
