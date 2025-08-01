import {
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ClientProxy } from '@nestjs/microservices'
import {
  Component,
  EntityType,
  GetSammelCheckpointPreviewDTO,
  ISammelCheckpoint,
  auditTrailCreate,
  computeSammelCheckpoint,
  filterEmittablePcMaterials,
} from '@smambu/lib.constantsjs'

import { SammelCheckpoint } from 'src/schemas/sammelCheckpoint.schema'
import { ObjectId } from 'mongodb'
import { LoggingService } from '@smambu/lib.commons-be'
import { PrescriptionsService } from './prescriptions.service'
import { PcMaterialsService } from './pcMaterials.service'

@Injectable()
export class SammelCheckpointService {
  constructor (
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    @InjectModel(SammelCheckpoint.name)
    private readonly sammelCheckpointModel: Model<SammelCheckpoint>,
    @Inject(PcMaterialsService)
    private readonly pcMaterialsService: PcMaterialsService,
    @Inject(PrescriptionsService)
    private readonly prescriptionsService: PrescriptionsService,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BILLING)
  }

  async createCheckpoint (checkpoint: ISammelCheckpoint, userId: string) {
    try {
      // TODO: fix permissions
      const newCheckpoint = await this.sammelCheckpointModel.create(checkpoint)
      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.SAMMEL_CHECKPOINT,
        newObj: newCheckpoint.toJSON(),
      })
      return newCheckpoint
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findLatestBySurgeon (doctorId: string) {
    try {
      // TODO: fix permissions
      const checkpoint = await this.sammelCheckpointModel
        .find({ doctorId })
        .sort({ createdAt: -1 })
        .limit(1)

      return checkpoint.length > 0 ? checkpoint[0] : null
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findById (checkpointId: string) {
    try {
      // TODO: fix permissions
      const checkpoint = await this.sammelCheckpointModel
        .findOne({
          _id: new ObjectId(checkpointId)
        })

      return checkpoint
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findMultiplesById (checkpointIds: string[]) {
    try {
      // TODO: fix permissions
      const objectifiedIds = checkpointIds.map(id => new ObjectId(id))

      return await this.sammelCheckpointModel.find({ _id: { $in: objectifiedIds } })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCheckpointPreview (data: GetSammelCheckpointPreviewDTO) {
    if (data.isCancellation) {
      const prescriptions = await this.prescriptionsService.getByCaseId(data.caseId)
      const prescription = prescriptions[0]
      if (prescription == null) return null

      const checkpoint = await this.findById(prescription.sammelCheckpointRef)
      if (checkpoint == null) throw new Error('error_checkpoint_not_found')

      return checkpoint
    } else {
      const pcMaterials = await this.pcMaterialsService.getPcMaterialsByCasesIds([data.caseId])
      const lastCheckpoint = await this.findLatestBySurgeon(data.doctorId)
      const emittablePcMaterials = filterEmittablePcMaterials(pcMaterials, lastCheckpoint)

      const previousConsumption = lastCheckpoint?.consumptions ?? []
      const newCheckpoint = computeSammelCheckpoint(
        emittablePcMaterials,
        previousConsumption,
        data.doctorId,
      )

      return newCheckpoint
    }
  }
}
