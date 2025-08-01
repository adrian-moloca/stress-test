import { Body, Controller, Get, HttpException, Post, Query, UseFilters, UseInterceptors } from '@nestjs/common'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor } from '@smambu/lib.commons-be'
import { PcMaterialsService, SammelCheckpointService } from 'src/services'
import { Case, checkPermission, GetSammelCheckpointPreviewDTO, parseErrorMessage, Patient, permissionRequests, PermissionsDec, PrescriptionsPcMaterialsRequestDTO, UserPermissions } from '@smambu/lib.constantsjs'
import { MessagePattern, RpcException } from '@nestjs/microservices'

@UseInterceptors(LoggingInterceptor)
@Controller('pc-materials')
export class PcMaterialsController {
  constructor (
    private readonly pcMaterialsService: PcMaterialsService,
    private readonly sammelCheckpointService: SammelCheckpointService,
  ) {}

  @Get()
  @UseFilters(AllExceptionsFilter)
  async getPcMaterialsByCasesIds (
    @PermissionsDec() userPermissions: UserPermissions,
    @Query('casesIds') casesIds: string[],
  ) {
    try {
      checkPermission(permissionRequests.canViewPcMaterials, { userPermissions })

      const pcMaterials =
        await this.pcMaterialsService.getPcMaterialsByCasesIds(casesIds)

      return pcMaterials
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'pcMaterials', cmd: 'updatePcMaterial' })
  async updatePcMaterial (
    {
      caseItem,
      patient,
    }:
    {
      caseItem: Case
      patient: Patient | null
    }
  ) {
    try {
      const pcMaterial = await this.pcMaterialsService.updatePcMaterial(caseItem, patient)

      return pcMaterial
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'pcMaterials', cmd: 'reviewPcMaterial' })
  async reviewPcMaterial (
    {
      pcMaterialId,
    }:
    {
      pcMaterialId: string
    }
  ) {
    try {
      const pcMaterial = await this.pcMaterialsService.reviewPcMaterial(pcMaterialId)

      return pcMaterial
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Post('/checkpointPreview')
  @UseFilters(AllExceptionsFilter)
  async getCheckpointPreview (
    @Body() data: GetSammelCheckpointPreviewDTO,
  ) {
    try {
      return await this.sammelCheckpointService.getCheckpointPreview(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'pcMaterials', cmd: 'getByCasesIds' })
  async getPcMaterialsByCasesIdsMP (
    {
      casesIds
    }:
    {
      casesIds: string[]
    }
  ) {
    try {
      const pcMaterials = await this.pcMaterialsService.getPcMaterialsByCasesIds(casesIds)

      return pcMaterials
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Get('/prescriptions-pc-materials')
  @UseFilters(AllExceptionsFilter)
  async getPrescriptionsPcMaterials (
    @PermissionsDec() userPermissions: UserPermissions,
    @Query() query: PrescriptionsPcMaterialsRequestDTO,
  ) {
    try {
      checkPermission(permissionRequests.canViewPrescribableMaterials, { userPermissions })
      checkPermission(permissionRequests.canViewDoctors, { userPermissions })
      checkPermission(permissionRequests.canViewMaterialsDatabase, { userPermissions })
      const caseObj =
          await this.pcMaterialsService.getPrescriptionsPcMaterials(query, userPermissions)

      return caseObj
    } catch (error) {
      console.error(error)
      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
