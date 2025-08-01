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
  ICaseBillingSnapshot,
  auditTrailCreate,
  auditTrailUpdate,
} from '@smambu/lib.constantsjs'
import { CaseBillingSnapshot } from 'src/schemas/casebillingsnapshot.schema'
import { LoggingService } from '@smambu/lib.commons-be'

@Injectable()
export class SnapshotService {
  constructor (
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,

    @InjectModel(CaseBillingSnapshot.name)
    private readonly snapshotModel: Model<CaseBillingSnapshot>,

    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BILLING)
  }

  async createOne (data: ICaseBillingSnapshot, userId: string) {
    try {
      const snapshot = await this.snapshotModel.create(data)

      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.CASE_BILLING_SNAPSHOT,
        newObj: snapshot.toJSON(),
      })

      return snapshot
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findByCaseId (caseId: string) {
    try {
      const snapshot = await this.snapshotModel.findOne({ 'case.caseId': caseId })

      return snapshot
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findMultipleByCaseIds (caseIds: string[]) {
    try {
      const snapshots = await this.snapshotModel.find({
        'case.caseId': {
          $in: caseIds
        }
      })
      return snapshots
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateByCaseId (snapshot: ICaseBillingSnapshot,
    caseId: string,
    userId: string,
    noAuditTrail: boolean = false) {
    try {
      const oldData = await this.snapshotModel.findOne({ 'case.caseId': caseId })
      const newValue = await this.snapshotModel.findOneAndUpdate({ 'case.caseId': caseId },
        snapshot,
        { new: true })

      if (!noAuditTrail)
        await auditTrailUpdate({
          logClient: this.logClient,
          userId,
          entityType: EntityType.CASE_BILLING_SNAPSHOT,
          prevObj: oldData.toJSON(),
          newObj: newValue.toJSON(),
        })

      return newValue
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteByCaseId (caseId: string) {
    try {
      await this.snapshotModel.findOneAndDelete({ 'case.caseId': caseId })
      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
