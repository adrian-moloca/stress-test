import {
  anagraphicsTypes,
  backendConfiguration,
  dateString,
  EAnagraphicsGetStatus,
  genericPermissionError,
  IAnagraphicRow,
  IAnagraphicVersion,
  parseErrorMessage,
  PermissionsDec,
  tDynamicAnagraphicSetup,
  tExecuteQueryPayload,
} from '@smambu/lib.constantsjs'
import { Body, Controller, Get, Param, Post, Delete, Req, HttpException, HttpStatus, UseFilters, UseInterceptors, Query } from '@nestjs/common'
import { endOfDay, isAfter, isValid, parse } from 'date-fns'
import { AnagraphicsService } from './services'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { AllExceptionsFilter, exportData, LoggingInterceptor, MPInterceptor } from '@smambu/lib.commons-be'
import { DynamicAnagraphicsSetupsService } from './services/dynamic-anagraphics-setups.service'

@UseInterceptors(LoggingInterceptor)
@Controller()
export class AppController {
  constructor (
    private readonly anagraphicsService: AnagraphicsService,
    private readonly dynamicAnagraphicsSetupsService: DynamicAnagraphicsSetupsService,
  ) { }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'dynamicData', cmd: 'updateDynamicAnagraphics' })
  async handleDynamicDataUpdate (
    { data }: { data: tDynamicAnagraphicSetup[] },
  ) {
    try {
      await this.dynamicAnagraphicsSetupsService.updateSetups(data)
      return true
    } catch (error) {
      console.error('Error updating dynamic anagraphics setups:', error)
      throw new RpcException(error.message)
    }
  }

  @Get(':anagraphicType/:subType/:versionId')
  @UseFilters(AllExceptionsFilter)
  async getVersion (
    @Param('anagraphicType') anagraphicType: anagraphicsTypes,
    @Param('subType') subType: anagraphicsTypes,
    @Param('versionId') versionId: string,
    @PermissionsDec() userPermissions,
    @Query() query: { updatedAt: Date }
  ) {
    try {
      const { canViewAll, canViewNames, anagraphicSetup } =
        await this.anagraphicsService.getAnagraphicSetupPermissions(
          anagraphicType,
          subType,
          userPermissions,
        )
      if (!canViewAll && !canViewNames)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

      const updatedAtNotNull = query.updatedAt != null
      const updatedAtDate = new Date(query.updatedAt)
      const updatedAt = updatedAtNotNull && isValid(updatedAtDate) ? updatedAtDate : null

      if (updatedAt != null) {
        const versionMetadata = await this.anagraphicsService
          .getVersionMetadata(anagraphicSetup, subType, versionId)
        if (!isAfter(versionMetadata.updatedAt, updatedAt))
          return { status: EAnagraphicsGetStatus.NO_CHANGES }
      }

      const anagraphicsVersions = await this.anagraphicsService
        .getVersion(
          anagraphicSetup,
          anagraphicType,
          subType,
          versionId,
          canViewNames && !canViewAll,
        )

      return {
        ...anagraphicsVersions,
        status: EAnagraphicsGetStatus.NEW,
      }
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  async getTargetAnagraphic (
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    date: string,
    userPermissions,
    skipPermissionCheck: boolean
  ): Promise<IAnagraphicVersion> {
    const { canViewAll, canViewNames, anagraphicSetup } =
      await this.anagraphicsService.getAnagraphicSetupPermissions(
        anagraphicType,
        subType,
        userPermissions,
      )
    if (!skipPermissionCheck && (!canViewAll && !canViewNames))
      throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

    const formattedDate = parse(date, dateString, new Date())
    if (!isValid(formattedDate)) throw new Error('Invalid date format')

    const formattedEndOfDay = endOfDay(formattedDate)
    const canViewOnlyNamesReturn = skipPermissionCheck ? false : !canViewAll

    return this.anagraphicsService
      .getActiveVersion(
        anagraphicSetup,
        anagraphicType,
        subType,
        formattedEndOfDay,
        canViewOnlyNamesReturn,
      )
  }

  @Get('/activeVersion/:anagraphicType/:subType/:date')
  @UseFilters(AllExceptionsFilter)
  async getActiveVersion (
    @Param('anagraphicType') anagraphicType: anagraphicsTypes,
    @Param('subType') subType: anagraphicsTypes,
    @Param('date') date: string, // yyyy-MM-dd
    @PermissionsDec() userPermissions,
    @Query() query: { updatedAt: Date, versionId: string }
  ) {
    try {
      const anagraphicSetup = await this.anagraphicsService.getAnagraphicSetup(
        anagraphicType,
        subType,
      )
      const formattedDate = parse(date, dateString, new Date())

      const updateAtNotNull = query.updatedAt != null
      const updatedAtDate = new Date(query.updatedAt)
      const updatedAt = updateAtNotNull && isValid(updatedAtDate) ? updatedAtDate : null

      if (query.versionId != null && updatedAt != null) {
        const versionMetadata = await this.anagraphicsService
          .getActiveVersionMetadata(anagraphicSetup, anagraphicType, subType, formattedDate)

        const versionDateIsAfterUpdate = !isAfter(versionMetadata.updatedAt, updatedAt)
        if (query.versionId === versionMetadata._id && versionDateIsAfterUpdate)
          return { status: EAnagraphicsGetStatus.NO_CHANGES }
      }

      const version = await this.getTargetAnagraphic(anagraphicType,
        subType,
        date,
        userPermissions,
        false)

      return {
        ...version,
        status: EAnagraphicsGetStatus.NEW,
      }
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post(':anagraphicType/:subType')
  @UseFilters(AllExceptionsFilter)
  async editVersion (
    @Param('anagraphicType') anagraphicType: anagraphicsTypes,
    @Param('subType') subType: anagraphicsTypes,
    @Body() data: IAnagraphicVersion,
    @PermissionsDec() userPermissions,
    @Req() req,
  ) {
    try {
      const anagraphicSetup = await this.anagraphicsService.getAnagraphicSetup(
        anagraphicType,
        subType,
      )
      const editPermission = anagraphicSetup.permissionsRequests.edit
      const canEdit = await this.anagraphicsService.evaluateExpression({
        expression: editPermission,
        userPermissions,
      })
      if (!canEdit.value)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

      return await this.anagraphicsService.editVersion(
        anagraphicSetup,
        anagraphicType,
        subType,
        data,
        req.user,
      )
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete(':anagraphicType/:subType/:versionId')
  @UseFilters(AllExceptionsFilter)
  async deleteVersion (
    @Param('anagraphicType') anagraphicType: anagraphicsTypes,
    @Param('subType') subType: anagraphicsTypes,
    @Param('versionId') versionId: string,
    @PermissionsDec() userPermissions,
    @Req() req,
  ) {
    try {
      const anagraphicSetup = await this.anagraphicsService.getAnagraphicSetup(
        anagraphicType,
        subType,
      )
      const deletePermission = anagraphicSetup.permissionsRequests.deleteVersion
      const canDelete = await this.anagraphicsService.evaluateExpression({
        expression: deletePermission,
        userPermissions,
      })
      if (!canDelete.value)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)

      return this.anagraphicsService.deleteVersion(anagraphicSetup, subType, versionId, req.user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'anagraphic', cmd: 'getTargetAnagraphic' })
  async mpGetTargetAnagraphic ({
    anagraphicType,
    subType,
    date,
    userPermissions
  }: {
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    date: string,
    userPermissions
  }) {
    try {
      return await this.getTargetAnagraphic(anagraphicType, subType, date, userPermissions, true)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'anagraphics', cmd: 'query' })
  async executeQuery (data: tExecuteQueryPayload) {
    try {
      return this.anagraphicsService.executeQuery(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'anagraphics', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_anagraphics)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'anagraphics', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, IAnagraphicRow[]>
  }) {
    try {
      return this.anagraphicsService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'anagraphics', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, IAnagraphicRow[]>
  }) {
    try {
      return this.anagraphicsService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
