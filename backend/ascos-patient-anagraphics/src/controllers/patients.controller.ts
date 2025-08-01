import {
  PermissionsDec,
  Patient,
  GetPatientsDto,
  UserPermissions,
  checkPermission,
  permissionRequests,
  booleanPermission,
  fullTextQueryDto,
  parseErrorMessage,
  backendConfiguration,
  tExecuteQueryPayload,
} from '@smambu/lib.constantsjs'
import {
  Body,
  Controller,
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
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { PatientsService } from 'src/services/patients.service'
import { ParseCreatePatient } from 'src/pipes/parseCreatePatient.pipe'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor, exportData } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller('patients')
export class PatientsController {
  constructor (private readonly patientsService: PatientsService) { }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async create (
    @PermissionsDec() userPermissions: UserPermissions,
    @Body(new ParseCreatePatient()) data: Patient,
    @Req() request: any,
  ) {
    try {
      checkPermission(permissionRequests.canEditPatients, { userPermissions })
      const patient = await this.patientsService.createOne(
        data,
        request.user.id,
      )
      return patient
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('/getFilteredPatients')
  @UseFilters(AllExceptionsFilter)
  async getFilteredPatients (
    @Body() body: GetPatientsDto,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canViewPatients, { userPermissions })
      const patients = await this.patientsService.getFilteredPatients(
        {
          cardInsuranceNumber: body.cardInsuranceNumber,
          name: body.name,
          surname: body.surname,
          birthDate: body.birthDate,
          address: body.address,
        },
        userPermissions,
      )
      return patients
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/full-text')
  @UseFilters(AllExceptionsFilter)
  async fullTextSearchPatients (
    @Query() query: fullTextQueryDto,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      const defaultPaginationLimit = Number(
        process.env.BE_DEFAULT_PAGINATION_LIMIT,
      )
      checkPermission(permissionRequests.canViewPatients, { userPermissions })
      const res = await this.patientsService.fullTextSearchPatients(
        query.query,
        query.page ? Number(query.page) : 0,
        query.limit ? Number(query.limit) : defaultPaginationLimit,
        userPermissions,
        query.sortBy,
        query.sortOrder,
        query.datePattern,
      )
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get(':id')
  @UseFilters(AllExceptionsFilter)
  async getPatient (
    @Param('id') id: string,
    @PermissionsDec() userPermissions: UserPermissions,
  ) {
    try {
      checkPermission(permissionRequests.canViewPatients, { userPermissions })
      const patient = await this.patientsService.findPatient(
        id,
        userPermissions,
      )
      return patient
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put(':patientId')
  @UseFilters(AllExceptionsFilter)
  async updatePatient (
    @Body(new ParseCreatePatient()) data: Patient,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req,
  ) {
    try {
      // A user can edit a patient if he can edit the patients of a doctor that has a case with the patient
      const res = await this.patientsService.updatePatient(
        data,
        req.user.id,
        userPermissions,
      )
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patients', cmd: 'getPatients' })
  async getPatientsMP ({
    patientsIds,
    userPermissions,
    permissionCheck = true,
  }: {
    patientsIds?: string[];
    userPermissions: UserPermissions;
    permissionCheck: boolean;
  }) {
    try {
      const permission = permissionCheck
        ? booleanPermission(permissionRequests.canViewPatients, {
          userPermissions,
        })
        : true
      if (!permission) return []
      return this.patientsService.getPatients({
        patientsIds,
        userPermissions,
        permissionCheck,
      })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patients', cmd: 'query' })
  async executeQuery (data: tExecuteQueryPayload) {
    try {
      return this.patientsService.executeQuery(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @MessagePattern({ role: 'patients', cmd: 'getAllPatients' })
  async getAllPatients () {
    try {
      return this.patientsService.getAllPatients()
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patients', cmd: 'normalizeDebtorNumbers' })
  async normalizeDebtorNumbers ({ limit }: { limit: number }) {
    try {
      return await this.patientsService.normalizeDebtorNumbers(limit)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patients', cmd: 'normalizePatientsNumbers' })
  async normalizePatientsNumbers ({ limit, sleepTime }: { limit: number, sleepTime?: number }) {
    try {
      return await this.patientsService.normalizePatientsNumbers(limit, sleepTime)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patients', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_patient_anagraphics)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patients', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.patientsService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'patients', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.patientsService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
