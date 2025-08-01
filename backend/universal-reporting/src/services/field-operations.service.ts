import { Injectable } from '@nestjs/common'
import { Component } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { FieldOperations } from 'src/schemas/field-operations.schema'

@Injectable()
export class FieldsOperationsService {
  constructor (
    @InjectModel(FieldOperations.name)
    private readonly fieldOperationsModel: Model<FieldOperations>,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.FIELDS_OPERATIONS_SERVICE)
  }

  async getFieldsOperationsToProcess (skipTenant?: boolean) {
    try {
      if (skipTenant) {
        const als = global.als
        const store = { bypassTenant: true }
        als.enterWith(store)
      }

      const fieldsOperations = await this.fieldOperationsModel.find({
        processed: false
      })

      return fieldsOperations
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async markOperationAsProcessed (id: string, tenantId: string) {
    try {
      await this.fieldOperationsModel.updateOne({ _id: id, tenantId }, {
        processed: true
      })
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  areThereOperationsRunning = async () => {
    try {
      const result = await this.fieldOperationsModel.exists({
        processed: false,
        blocking: true,
      })

      return result != null
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }
}
