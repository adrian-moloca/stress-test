import { Body, Controller, HttpException, Param, Post, UseFilters, UseInterceptors } from '@nestjs/common'
import { AllExceptionsFilter, LoggingInterceptor } from '@smambu/lib.commons-be'
import { checkPermission, IGeneratePrescriptionsDTO, IUser, parseErrorMessage, permissionRequests, PermissionsDec, PrescriptionsFullTextQueryDto, UserDec, UserPermissions } from '@smambu/lib.constantsjs'
import { PrescriptionsService } from 'src/services'

@UseInterceptors(LoggingInterceptor)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor (
    private readonly prescriptionsService: PrescriptionsService,
  ) {
  }

  @Post('/full-text')
  @UseFilters(AllExceptionsFilter)
  async fetchPrescriptions (
    @Body() query: PrescriptionsFullTextQueryDto,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      const defaultPaginationLimit = Number(process.env.VITE_DEFAULT_PAGINATION_LIMIT)

      const fromTimeStamp = query.fromTimestamp && Number(query.fromTimestamp)
      const toTimeStamp = query.toTimestamp && Number(query.toTimestamp)

      checkPermission(permissionRequests.canViewPcMaterials, { userPermissions })

      const res = await this.prescriptionsService.fullTextSearch(
        userPermissions,
        query.query,
        query.page ? Number(query.page) : 0,
        query.limit ? Number(query.limit) : defaultPaginationLimit,
        query.sortBy,
        query.sortOrder,
        query.datePattern,
        defaultPaginationLimit,
        fromTimeStamp,
        toTimeStamp,
        query.casesIds,
      )

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(
        message,
        error?.status ?? 500,
      )
    }
  }

  @Post('/get-prescriptions-csv')
  @UseFilters(AllExceptionsFilter)
  async getPrescriptionsCSV (
    @Body() query: PrescriptionsFullTextQueryDto,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      const defaultPaginationLimit = Number(process.env.VITE_DEFAULT_PAGINATION_LIMIT)

      const fromTimeStamp = query.fromTimestamp && Number(query.fromTimestamp)
      const toTimeStamp = query.toTimestamp && Number(query.toTimestamp)

      checkPermission(permissionRequests.canViewCasesBilling, { userPermissions })
      checkPermission(permissionRequests.canViewBills, { userPermissions })

      const res = await this.prescriptionsService.fullTextSearch(
        userPermissions,
        query.query,
        0,
        // this is a hack to get all the possible cases in the db without the
        // need to rewrite and entire function with just a limit removed
        99999999,
        query.sortBy,
        query.sortOrder,
        query.datePattern,
        defaultPaginationLimit,
        fromTimeStamp,
        toTimeStamp,
        query.casesIds,
      )

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(
        message,
        error?.status ?? 500,
      )
    }
  }

  @Post('generate')
  @UseFilters(AllExceptionsFilter)
  async generatePrescriptions (
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() body: IGeneratePrescriptionsDTO,
    @UserDec() user: IUser,
  ) {
    checkPermission(permissionRequests.canViewPcMaterials, { userPermissions })

    await this.prescriptionsService.generatePrescriptions(body, user)
  }

  @Post('setPrescribed/:prescriptionId')
  @UseFilters(AllExceptionsFilter)
  async setPrescriptionPrescribed (
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('prescriptionId') prescriptionId: string,
    @UserDec() user: IUser,
  ) {
    checkPermission(permissionRequests.canViewPcMaterials, { userPermissions })

    await this.prescriptionsService.setPrescriptionPrescribed(prescriptionId, user)
  }
}
