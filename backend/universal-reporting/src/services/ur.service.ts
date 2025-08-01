import { Injectable } from '@nestjs/common'
import { Component, DEPENDENCY_JOB_TYPE, tCondition, tContext, tDomain, tExpression, tField, tFieldOperations, tFragments, tProxy, tProxyDynamicFields, tTranslatableString, tTrigger, tURConfigsData, tValidEventName, tVersionlessURConfigsData, URConfigs } from '@smambu/lib.constantsjs'
import { LoggingService, tMatchingTriggers } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Proxy } from 'src/schemas/proxy.schema'
import { URDomain } from 'src/schemas/domain.schema'
import { NamedExpression } from 'src/schemas/namedExpression.schema'
import { ImportedEvents } from 'src/schemas/imported-events.schema'

@Injectable()
export class URService {
  constructor (
    @InjectModel(ImportedEvents.name)
    private readonly importedEventsModel: Model<ImportedEvents>,
    @InjectModel(Proxy.name)
    private readonly proxyModel: Model<Proxy>,
    @InjectModel(URDomain.name)
    private readonly domainsModel: Model<URDomain>,
    @InjectModel(NamedExpression.name)
    private readonly namedExpressionModel: Model<NamedExpression>,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.UNIVERSAL_REPORTING)
  }

  // Test dynamic data
  async editDynamicData ({
    data, entityId, entityType,
  }: {
    data: Record<string, unknown>, entityId: string, entityType: string
  }): Promise<boolean | void> {
    try {
      // Call the users service to update the entity's data
      // eslint-disable-next-line no-console
      console.log('Calling the users service to update the entity data...', data, entityId, entityType)

      return true
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async handleDomain (
    domainId: string,
    domainName: tTranslatableString,
    tenantId: string,
    domainDescription: tTranslatableString,
    trigger: tTrigger,
    proxyFields: tField[],
    canAccessProxies: tCondition,
    canAccessProxyDetails: tCondition,
    canEditProxy: tCondition

  ) {
    try {
      const targetDomain = await this.domainsModel.findOne({ domainId })

      const existingFields = targetDomain?.proxyFields ?? []

      const toCreate: tField[] = proxyFields.filter(current => {
        if (existingFields.length === 0)
          return true

        return existingFields.every(existing => existing.id !== current.id)
      })

      const toUpdate: tField[] = proxyFields.filter(current => {
        if (existingFields.length === 0)
          return false

        return existingFields.some(existing => {
          const fieldMatch = existing.id === current.id
          const versionMismatch = existing.version !== current.version

          return fieldMatch && versionMismatch
        })
      })

      const toDelete: tField[] = existingFields.filter(current => {
        return proxyFields.every(existing => existing.id !== current.id)
      })

      const toCreateParsed: tFieldOperations[] = toCreate.map(current => ({
        type: DEPENDENCY_JOB_TYPE.CREATE,
        field: current,
        domainId,
        tenantId,
        blocking: true,
        processed: false
      }))

      const toDeleteParsed: tFieldOperations[] = toDelete.map(current => ({
        type: DEPENDENCY_JOB_TYPE.DELETE,
        field: current,
        domainId,
        tenantId,
        blocking: true,
        processed: false
      }))

      const toUpdateParsed: tFieldOperations[] = toUpdate.map(current => ({
        type: DEPENDENCY_JOB_TYPE.UPDATE,
        field: current,
        domainId,
        tenantId,
        blocking: true,
        processed: false
      }))

      const returnObj: tFieldOperations[] = [
        ...toCreateParsed,
        ...toUpdateParsed,
        ...toDeleteParsed
      ]

      const domainExists = targetDomain != null
      if (!domainExists) {
        // XXX TODO: modify this when the domain schema is completed
        const payload: Omit<tDomain,
          'documentTypes' |
          'proxyDetails' |
          'proxyTable' |
          'proxyBillableCondition'> = {
          domainId,
          domainName,
          domainDescription,
          trigger,
          proxyFields,
          canAccessProxies,
          canAccessProxyDetails,
          canEditProxy
        }

        await this.domainsModel.create(payload)
      } else {
        await this.domainsModel.updateOne({ domainId }, {
          domainName,
          domainDescription,
          trigger,
          proxyFields
        })
      }

      return returnObj
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getDomainFields (domainId: string, tenantId: string) {
    try {
      const domain = await this.domainsModel.findOne({ domainId, tenantId })

      if (domain == null)
        throw Error(`Domain ${domainId} does not exists`)

      return domain.proxyFields
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUnprocessedImportedEvents (skipTenant: boolean = false) {
    try {
      if (skipTenant) {
        const als = global.als
        const store = { bypassTenant: true }
        als.enterWith(store)
      }

      const unprocessedEvents = await this.importedEventsModel
        .find({ processed: false })

      return unprocessedEvents
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findMatchingTriggers (
    eventType: tValidEventName,
  ):Promise<tMatchingTriggers[]> {
    try {
      const matchingDomains = await this.domainsModel.find({
        'trigger.eventType': eventType
      })

      if (matchingDomains !== null) {
        const parsedResult = matchingDomains.map(({ trigger, tenantId, domainId }) => ({
          trigger,
          tenantId,
          domainId
        }))

        return parsedResult
      }
      //
      return []
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async markEventAsProcessed (id: string) {
    try {
      const returnValue = await this.importedEventsModel.updateOne({
        _id: id
      }, {
        $set: { processed: true }
      })

      return returnValue
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createProxy (
    contextKey: string,
    context: tContext,
    domainId: string,
    fields: tField[],
    fragments?: tFragments
  ) {
    const store = global.als.getStore()
    try {
      // TODO: ref #1369
      store!.skipRWMiddleware = true
      const dynamicFields:tProxyDynamicFields = {}

      fields.forEach(current => {
        const fieldId = current.id

        dynamicFields[fieldId] = undefined
      })

      const newProxyData: Omit<tProxy, 'id'> = {
        context,
        contextKey,
        domainId,
        dynamicFields,
        fragments
      }

      const newDocument = await this.proxyModel.create(newProxyData)

      // TODO: ref #1369
      store!.skipRWMiddleware = false

      return newDocument
    } catch (e) {
      // TODO: ref #1369
      store!.skipRWMiddleware = false

      if (e.code === 11000)
        return null

      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getNamedExpressions (namedExpressionId: string) {
    try {
      const namedExpression = await this.namedExpressionModel.findById(namedExpressionId)

      if (namedExpression == null)
        throw new Error('Named expression not found') // Should never happen

      return namedExpression
    } catch (e) {
      console.error(e)
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createNamedExpression (data: tExpression) {
    try {
      const namedExpression = await this.namedExpressionModel.create({ data })

      return namedExpression.toObject()
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async extractNamedExpressions (
    data: unknown
  ): Promise<tExpression | unknown> {
    if (Array.isArray(data)) {
      const result = []

      for (const item of data) {
        const parsedData = await this.extractNamedExpressions(item)

        result.push(parsedData)
      }

      return result
    }

    if (data !== null && typeof data === 'object') {
      if ('expressionKind' in data && '__ignorePermissions' in data) {
        const newNamedExpression = await this.createNamedExpression(data as tExpression)

        const result = {
          expressionKind: 'namedExpression',
          namedExpressionId: newNamedExpression._id.toString()
        }

        return result as tExpression
      }

      return data
    }

    return data
  }

  async extractAndCreateNamedExpressions (data: tVersionlessURConfigsData) {
    try {
      await this.namedExpressionModel.deleteMany()

      const billingNE = await this.extractNamedExpressions(data[URConfigs.BILLING_CONFIG])
      const dynamicDataNE = await this.extractNamedExpressions(data[URConfigs.DYNAMIC_DATA])

      return {
        [URConfigs.BILLING_CONFIG]: billingNE,
        [URConfigs.DYNAMIC_DATA]: dynamicDataNE,
      }
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  insertNamedExpressions = async (
    data: unknown,
  ): Promise<unknown | tExpression> => {
    if (Array.isArray(data)) {
      const result = []

      for (const item of data) {
        const parsedData = await this.insertNamedExpressions(item)
        result.push(parsedData)
      }

      return result
    }

    if (data !== null && typeof data === 'object') {
      if ('namedExpressionId' in data && typeof data.namedExpressionId === 'string') {
        const namedExpression = await this.getNamedExpressions(data.namedExpressionId)

        if (namedExpression == null)
          throw new Error(`Named expression "${data.namedExpressionId}" not found`)

        const result = namedExpression.data

        return result
      }

      return data
    }
    return data
  }

  async parseWithNamedExpressions (data: tURConfigsData) {
    try {
      const billingNE = await this.insertNamedExpressions(data[URConfigs.BILLING_CONFIG])
      const dynamicDataNE = await this.insertNamedExpressions(data[URConfigs.DYNAMIC_DATA])

      return {
        [URConfigs.BILLING_CONFIG]: billingNE,
        [URConfigs.DYNAMIC_DATA]: dynamicDataNE,
      }
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }
}
