import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Component, tDynamicAnagraphicSetup } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'
import { DynamicAnagraphicsSetups, DynamicAnagraphicsSetupsDocument } from '../schemas/dynamic-anagraphics-setups.schema'

@Injectable()
export class DynamicAnagraphicsSetupsService {
  constructor (
    @InjectModel(DynamicAnagraphicsSetups.name)
    private readonly dynamicAnagraphicsSetupsModel: Model<DynamicAnagraphicsSetupsDocument>,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.DYNAMIC_ANAGRAPHICS_SETUPS)
  }

  async getSetupsByTenant (tenantId: string): Promise<tDynamicAnagraphicSetup[]> {
    try {
      const setups = await this.dynamicAnagraphicsSetupsModel.findOne({ tenantId })
      return setups?.setups ?? []
    } catch (error) {
      return await this.loggingService.throwErrorAndLog(error)
    }
  }

  async getAllSetups (): Promise<Record<string, tDynamicAnagraphicSetup[]>> {
    try {
      const setups = await this.dynamicAnagraphicsSetupsModel.find()

      return setups.reduce((acc, setup) => {
        acc[setup.tenantId] = setup.setups
        return acc
      }, {} as Record<string, tDynamicAnagraphicSetup[]>)
    } catch (error) {
      return await this.loggingService.throwErrorAndLog(error)
    }
  }

  async updateSetups (
    setups: tDynamicAnagraphicSetup[],
  ) {
    try {
      await this.dynamicAnagraphicsSetupsModel.updateOne(
        {},
        { setups },
        { upsert: true }
      )

      return null
    } catch (error) {
      return await this.loggingService.throwErrorAndLog(error)
    }
  }
}
