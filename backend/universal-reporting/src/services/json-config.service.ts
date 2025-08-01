import { Injectable, Inject } from '@nestjs/common'
import { callMSWithTimeoutAndRetry, Component, tBillingConfig, tDynamicDataList, tURConfigKeys, tURConfigsData, URConfigs, VERSIONS_NAMES } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BillingConfig } from 'src/schemas/billing-config.schema'
import { DynamicDataConfig } from 'src/schemas/dynamic-config.schema'
import { JsonConfig } from 'src/schemas/json-config.schema'
import { URService } from './ur.service'
import { FieldOperations } from 'src/schemas/field-operations.schema'
import { FieldsOperationsService } from './field-operations.service'
import { ClientProxy } from '@nestjs/microservices'

@Injectable()
export class JsonConfigsService {
  constructor (
    @InjectModel(JsonConfig.name)
    private readonly jsonConfigModel: Model<JsonConfig>,
    @InjectModel(BillingConfig.name)
    private readonly billingConfigModel: Model<BillingConfig>,
    @InjectModel(DynamicDataConfig.name)
    private readonly dynamicDataConfigModel: Model<DynamicDataConfig>,
    @InjectModel(FieldOperations.name)
    private readonly fieldOperationsModel: Model<FieldOperations>,
    private readonly urService: URService,
    private readonly fieldsOperationsService: FieldsOperationsService,
    private loggingService: LoggingService,
    @Inject('ANAGRAPHICS_CLIENT')
    private readonly anagraphicsClient: ClientProxy,
  ) {
    this.loggingService.setComponent(Component.CONFIG_SERVICE)
  }

  async canUploadNewConfig () {
    try {
      const systemIsBusy = await this.fieldsOperationsService.areThereOperationsRunning()

      return !systemIsBusy
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async saveConfig (data: tURConfigsData) {
    try {
      const store = global.als.getStore()
      // XXX This should never happen, but it makes typescript happy and adds
      // a little more security
      if (store === undefined)
        throw Error('Error: als store is missing in save config service')

      const tenantId = store.tenantId

      // XXX This should never happen, but it makes typescript happy and adds
      // a little more security
      if (tenantId === undefined)
        throw Error('Error: tenantid is missing in save config service')

      // Before doing anything on named expression we upload the new config, so
      // that any error (i.e. duplicate version number) gets spotted early on
      const newConfig = await this.jsonConfigModel.create({ data, version: data.version })

      const dataWithNamedExpressionsExtracted = await this.urService
        .extractAndCreateNamedExpressions(data)

      await this.billingConfigModel.create({
        data: dataWithNamedExpressionsExtracted[URConfigs.BILLING_CONFIG],
        versionRef: newConfig.id,
      })

      // eslint-disable-next-line max-len
      const dynamicData = dataWithNamedExpressionsExtracted[URConfigs.DYNAMIC_DATA] as tDynamicDataList
      await this.dynamicDataConfigModel.create({
        data: dynamicData,
        versionRef: newConfig.id
      })

      const payload = { tenantId, data: dynamicData.anagraphics }
      await callMSWithTimeoutAndRetry(
        this.anagraphicsClient,
        { role: 'dynamicData', cmd: 'updateDynamicAnagraphics' },
        payload,
        Component.CONFIG_SERVICE
      )

      // eslint-disable-next-line max-len
      const billingConfig = dataWithNamedExpressionsExtracted[URConfigs.BILLING_CONFIG] as tBillingConfig
      const domains = billingConfig.domains

      for (const domain of domains) {
        const {
          domainId,
          domainDescription,
          domainName,
          trigger,
          proxyFields,
          canAccessProxies,
          canAccessProxyDetails,
          canEditProxy
        } = domain

        const fieldsOperationToWrite = await this.urService.handleDomain(
          domainId,
          domainName,
          tenantId,
          domainDescription,
          trigger,
          proxyFields,
          canAccessProxies,
          canAccessProxyDetails,
          canEditProxy
        )

        await this.fieldOperationsModel.insertMany(fieldsOperationToWrite)
      }

      return true
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getConfig (version: string) {
    try {
      let config
      if (version === VERSIONS_NAMES.LATEST)
        config = await this.jsonConfigModel.findOne().sort({ _id: -1 })
      else
        config = await this.jsonConfigModel.find({ version })

      if (config == null)
        return null

      // @ts-expect-error this needs better types when everything is well defined and tested
      const parsedConfig = await this.urService.parseWithNamedExpressions(config.data)

      return {
        ...parsedConfig,
        // @ts-expect-error this needs better types when everything is weel defined and tested
        updatedAt: config.updatedAt,
        version
      }
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  getTargetConfig = async (version:string, type: tURConfigKeys) => {
    try {
      let config
      if (version === VERSIONS_NAMES.LATEST)
        config = await this.jsonConfigModel.findOne({}, { _id: 1 }).sort({ _id: -1 })
      else
        config = await this.jsonConfigModel.findOne({ version }, { _id: 1 })

      if (config == null)
        throw Error(`No general config matches version ${version}`)

      let correctModel
      switch (type) {
        case URConfigs.BILLING_CONFIG:
          correctModel = this.billingConfigModel
          break

        case URConfigs.DYNAMIC_DATA:
          correctModel = this.dynamicDataConfigModel
          break

        default:
          throw Error(`Config ${type} is not supported`)
      }

      const dynamicDataConfig = await correctModel.findOne({ versionRef: config.id })

      if (dynamicDataConfig == null)
        throw Error(`No dynamicData config matches version ${version}`)

      return dynamicDataConfig.data
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getURConfigsLastUpdate () {
    try {
      const config = await this.jsonConfigModel.findOne().sort({ _id: -1 })
      if (config == null)
        return null

      // @ts-expect-error ts is wrong, see the mongoose schema for more details
      return config.updatedAt
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
