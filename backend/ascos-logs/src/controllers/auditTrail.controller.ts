import {
  Controller,
  Get,
  Param,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import {
  PermissionsDec,
  checkPermission,
  permissionRequests,
  QueryAuditTrailDto,
  SaveAuditTrailDto,
} from '@smambu/lib.constantsjs'
import { AuditTrailService } from 'src/services/auditTrail.service'
import { MessagePattern } from '@nestjs/microservices'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller('audit-trails')
export class AuditTrailController {
  constructor (private readonly auditTrailService: AuditTrailService) {}

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'audit-trail', cmd: 'createAtlasSearchIndex' })
  async createAtlasSearchIndex () {
    return this.auditTrailService.createAtlasSearchIndex()
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async getAuditTrails (@Query() query: QueryAuditTrailDto, @PermissionsDec() userPermissions) {
    checkPermission(permissionRequests.canViewAuditTrails, { userPermissions })
    const res = await this.auditTrailService.findAuditTrails(query)
    return res
  }

  @Get('/:id')
  @UseFilters(AllExceptionsFilter)
  async getAuditTrailById (@Param('id') id: string, @PermissionsDec() userPermissions) {
    checkPermission(permissionRequests.canViewAuditTrails, { userPermissions })
    const contract = await this.auditTrailService.findAuditTrail(id)

    return contract
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'audit-trail', cmd: 'save' })
  async auditCreate ({
    userId,
    entityType, entityDatabaseId, action, prevObj, newObj, entityNameOrId, anagraphicSetup
  }: SaveAuditTrailDto) {
    await this.auditTrailService.saveAudit({
      userId,
      entityType,
      entityNameOrId,
      entityDatabaseId,
      action,
      prevObj,
      newObj,
      anagraphicSetup,
    })
  }
}
